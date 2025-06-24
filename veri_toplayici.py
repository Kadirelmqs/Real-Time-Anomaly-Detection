# veri_toplayici.py

import time
import threading
import statistics
from collections import defaultdict
from scapy.all import sniff, IP, TCP, UDP
import csv
import os

# --- AYARLAR ---
AKIS_ZAMAN_ASIMI = 30  # Saniye cinsinden bir akışın ne kadar süre pasif kalabileceği
ARAYUZ_ADI = "Wi-Fi"   # Lütfen kendi ağ arayüzünüzün doğru adını yazın
LOG_FILENAME = 'live_traffic_log.csv' # Kaydedilecek dosyanın adı

# --- Global Değişkenler ---
active_flows = {}
lock = threading.Lock()

# --- app.py'den Kopyalanan Fonksiyonlar ---

def get_flow_key(paket):
    if IP in paket:
        p = paket[IP]
        proto_num = p.proto
        if TCP in paket or UDP in paket:
            sport, dport = p.sport, p.dport
            if p.src < p.dst: return (p.src, sport, p.dst, dport, proto_num)
            else: return (p.dst, dport, p.src, sport, proto_num)
    return None

def finalize_flow_and_save_to_csv(flow_key, flow_data):
    """ Bir akış bittiğinde özelliklerini hesaplar ve CSV dosyasına yazar. """
    try:
        dur = flow_data['last_seen'] - flow_data['start_time']
        if dur <= 0: dur = 0.000001
        
        total_pkts = flow_data['spkts'] + flow_data['dpkts']
        
        proto_map = {1: 'icmp', 6: 'tcp', 17: 'udp'}
        proto_str = proto_map.get(flow_key[4], 'other')

        flow_dict = {
            'dur': dur, 'proto': proto_str, 'service': flow_data.get('service', '-'),
            'state': flow_data.get('state', 'INT'), 'spkts': flow_data['spkts'],
            'dpkts': flow_data['dpkts'], 'sbytes': flow_data['sbytes'], 'dbytes': flow_data['dbytes'],
            'rate': total_pkts / dur if dur > 0 else 0, 'sttl': flow_data['sttl'],
            'dttl': flow_data.get('dttl', 0), 'sload': (flow_data['sbytes'] * 8) / dur if dur > 0 else 0,
            'dload': (flow_data['dbytes'] * 8) / dur if dur > 0 else 0, 'sloss': 0, 'dloss': 0,
            'sinpkt': statistics.mean(flow_data['sinpkt_list']) if len(flow_data['sinpkt_list']) > 0 else 0,
            'dinpkt': statistics.mean(flow_data['dinpkt_list']) if len(flow_data['dinpkt_list']) > 0 else 0,
            'sjit': statistics.pstdev(flow_data['sinpkt_list']) if len(flow_data['sinpkt_list']) > 1 else 0,
            'djit': statistics.pstdev(flow_data['dinpkt_list']) if len(flow_data['dinpkt_list']) > 1 else 0,
            'swin': flow_data.get('swin', 0), 'stcpb': flow_data.get('stcpb', 0),
            'dtcpb': flow_data.get('dtcpb', 0), 'dwin': flow_data.get('dwin', 0),
            'tcprtt': 0, 'synack': 0, 'ackdat': 0,
            'smean': int(flow_data['sbytes'] / flow_data['spkts']) if flow_data['spkts'] > 0 else 0,
            'dmean': int(flow_data['dbytes'] / flow_data['dpkts']) if flow_data['dpkts'] > 0 else 0,
            'trans_depth': 0, 'response_body_len': 0, 'ct_srv_src': 1, 'ct_state_ttl': 0,
            'ct_dst_ltm': 1, 'ct_src_dport_ltm': 1, 'ct_dst_sport_ltm': 1, 'ct_dst_src_ltm': 1,
            'is_ftp_login': 0, 'ct_ftp_cmd': 0, 'ct_flw_http_mthd': 0, 'ct_src_ltm': 1,
            'ct_srv_dst': 1, 'is_sm_ips_ports': 0
        }
        
        # --- Sadece CSV Dosyasına Yazma Mantığı ---
        file_exists = os.path.exists(LOG_FILENAME)
        with open(LOG_FILENAME, 'a', newline='', encoding='utf-8') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=flow_dict.keys())
            if not file_exists:
                writer.writeheader()
            writer.writerow(flow_dict)
            
        print(f"\n[+] Akış '{LOG_FILENAME}' dosyasına eklendi.")

    except Exception as e:
        print(f"\n❌ HATA (finalize_flow_and_save_to_csv): {e}")

def process_packet(paket):
    """ Her paketi işleyen ana fonksiyon. """
    flow_key = get_flow_key(paket)
    if not flow_key:
        return

    now = time.time()
    src_ip_key_in_flow = flow_key[0]
    
    with lock:
        if flow_key not in active_flows:
            active_flows[flow_key] = defaultdict(lambda: 0, {
                'start_time': now, 'last_seen': now, 'spkts': 0, 'dpkts': 0, 
                'sbytes': 0, 'dbytes': 0, 'sttl': 0, 'sinpkt_list': [], 
                'dinpkt_list': [], 'last_spkt_time': 0, 'last_dpkt_time': 0
            })
        
        flow_data = active_flows[flow_key]
        flow_data['last_seen'] = now
        p = paket[IP]
        is_packet_from_flow_src_to_flow_dst = (p.src == src_ip_key_in_flow)
        
        if is_packet_from_flow_src_to_flow_dst:
            flow_data['spkts'] += 1; flow_data['sbytes'] += len(p)
            if flow_data['sttl'] == 0: flow_data['sttl'] = p.ttl
            if flow_data['last_spkt_time'] != 0: flow_data['sinpkt_list'].append(now - flow_data['last_spkt_time'])
            flow_data['last_spkt_time'] = now
            if TCP in p:
                if 'swin' not in flow_data: flow_data['swin'] = p[TCP].window
                if 'stcpb' not in flow_data: flow_data['stcpb'] = p[TCP].seq
        else:
            flow_data['dpkts'] += 1; flow_data['dbytes'] += len(p)
            if 'dttl' not in flow_data: flow_data['dttl'] = p.ttl
            if flow_data['last_dpkt_time'] != 0: flow_data['dinpkt_list'].append(now - flow_data['last_dpkt_time'])
            flow_data['last_dpkt_time'] = now
            if TCP in p:
                if 'dwin' not in flow_data: flow_data['dwin'] = p[TCP].window
                if 'dtcpb' not in flow_data: flow_data['dtcpb'] = p[TCP].seq
        
        if TCP in p and (p[TCP].flags.F or p[TCP].flags.R):
            flow_data['state'] = 'FIN' if p[TCP].flags.F else 'RST'
            finalize_flow_and_save_to_csv(flow_key, active_flows.pop(flow_key))

def timeout_checker():
    """ Zaman aşımına uğrayan akışları periyodik olarak kontrol eder. """
    while True:
        time.sleep(AKIS_ZAMAN_ASIMI)
        now = time.time()
        with lock:
            timed_out_keys = [key for key, data in active_flows.items() if now - data['last_seen'] > AKIS_ZAMAN_ASIMI]
            if timed_out_keys:
                print(f"\n[!] {len(timed_out_keys)} adet zaman aşımına uğrayan akış sonlandırılıyor...")
            for key in timed_out_keys:
                active_flows[key]['state'] = 'INT' 
                finalize_flow_and_save_to_csv(key, active_flows.pop(key))

def start_packet_capture():
    """ Paket yakalamayı başlatan ana fonksiyon. """
    print(f"🚀 Paket yakalama motoru başlatılıyor. Dinlenen arayüz: {ARAYUZ_ADI}")
    try:
        sniff(iface=ARAYUZ_ADI, prn=process_packet, store=False, filter="ip")
    except Exception as e:
        print(f"\n❌ HATA (start_packet_capture): {e}")
        print("💡 İpucu: Script'i yönetici (sudo) olarak çalıştırdığınızdan ve arayüz adının doğru olduğundan emin olun.")

# --- ANA PROGRAM BAŞLANGICI ---
if __name__ == '__main__':
    # Varsa eski log dosyasını silerek temiz bir başlangıç yapalım
    if os.path.exists(LOG_FILENAME):
        os.remove(LOG_FILENAME)
        print(f"Eski log dosyası '{LOG_FILENAME}' silindi.")

    # Arka plan thread'lerini başlat
    capture_thread = threading.Thread(target=start_packet_capture, daemon=True)
    timeout_thread = threading.Thread(target=timeout_checker, daemon=True)
    
    capture_thread.start()
    timeout_thread.start()
    
    print("\nVeri toplama başladı. Normal internet aktivitelerinizi yapabilirsiniz.")
    print(f"Bu script, siz durdurana kadar ('Ctrl+C') çalışmaya devam edecek ve verileri '{LOG_FILENAME}' dosyasına kaydedecektir.")
    
    try:
        # Ana thread'in sonlanmaması için sonsuz döngü
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nVeri toplama durduruldu. Program sonlandırılıyor.")