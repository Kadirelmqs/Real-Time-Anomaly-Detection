# --- Gerekli Tüm Kütüphaneler ---
import time
import json
import threading
import queue
import pandas as pd
import numpy as np
import joblib
import statistics
from collections import defaultdict
from flask import Flask, render_template, Response
from scapy.all import sniff, IP, TCP, UDP

# --- FLASK UYGULAMASI ---
app = Flask(__name__)

ANOMALY_THRESHOLD = 0.85 #87

# --- MODEL YÜKLEME ---
try:
    model_pipeline = joblib.load('models/unsw_rf_model_v4.pkl')
    print("✅ Model 'unsw_rf_model_v4.pkl' başarıyla yüklendi.")
    FINAL_MODEL_COLUMNS = model_pipeline.feature_names_in_
    print(f"🔬 Modelin beklediği {len(FINAL_MODEL_COLUMNS)} sütun adı başarıyla alındı.")
except Exception as e:
    print(f"❌ HATA: Model yüklenirken bir sorun oluştu: {e}")
    model_pipeline = None
    FINAL_MODEL_COLUMNS = []

# --- VERİ KUYRUĞU VE FLOW MANAGER MANTIĞI ---
data_queue = queue.Queue()
AKIS_ZAMAN_ASIMI = 30 # Test için zaman aşımını 15 saniyeye düşürdük!
active_flows = {}
lock = threading.Lock()

def get_flow_key(paket):
    if IP in paket:
        p = paket[IP]
        proto_num = p.proto
        if TCP in paket or UDP in paket:
            sport, dport = p.sport, p.dport
            if p.src < p.dst:
                return (p.src, sport, p.dst, dport, proto_num)
            else:
                return (p.dst, dport, p.src, sport, proto_num)
    return None

def finalize_flow_and_queue(flow_key, flow_data):
    """ Bir akış bittiğinde özelliklerini hesaplar ve bir dictionary olarak kuyruğa atar. """
    print(f"\n[6] Akış sonlandırma fonksiyonu çağrıldı: {flow_key}")
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
        data_queue.put(flow_dict)
        print(f"\n[+] Akış Başarıyla Kuyruğa Eklendi!")
    except Exception as e:
        print(f"\n❌ HATA (finalize_flow_and_queue): {e}")

def process_packet(paket):
    """ Her paketi işleyen ana fonksiyon. (Kontrol Noktaları Eklendi) """
    # print(".", end="", flush=True) # [1] Paket yakalandı mı?
    flow_key = get_flow_key(paket)
    if not flow_key:
        return
    # print(":", end="", flush=True) # [2] Geçerli bir akış anahtarı var mı?

    now = time.time()
    src_ip_key_in_flow = flow_key[0]
    
    with lock:
        if flow_key not in active_flows:
            # print("N", end="", flush=True) # [3] Yeni bir akış mı?
            active_flows[flow_key] = defaultdict(lambda: 0, {
                'start_time': now, 'last_seen': now, 'spkts': 0, 'dpkts': 0, 
                'sbytes': 0, 'dbytes': 0, 'sttl': 0, 'sinpkt_list': [], 
                'dinpkt_list': [], 'last_spkt_time': 0, 'last_dpkt_time': 0
            })
        # else:
        #     print("U", end="", flush=True) # [4] Mevcut bir akış mı güncelleniyor?
        
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
            print("F", end="", flush=True) # [5] FIN/RST paketiyle akış sonlanıyor mu?
            flow_data['state'] = 'FIN' if p[TCP].flags.F else 'RST'
            finalize_flow_and_queue(flow_key, active_flows.pop(flow_key))

def timeout_checker():
    """ Zaman aşımına uğrayan akışları periyodik olarak kontrol eder. """
    while True:
        time.sleep(AKIS_ZAMAN_ASIMI)
        print(f"\n[7] Zaman aşımı kontrolü çalışıyor (aktif akış sayısı: {len(active_flows)})...")
        now = time.time()
        with lock:
            timed_out_keys = [key for key, data in active_flows.items() if now - data['last_seen'] > AKIS_ZAMAN_ASIMI]
            if timed_out_keys:
                print(f"\n[8] {len(timed_out_keys)} adet zaman aşımına uğrayan akış bulundu!")
            for key in timed_out_keys:
                active_flows[key]['state'] = 'INT' 
                finalize_flow_and_queue(key, active_flows.pop(key))

def start_packet_capture():
    """ Paket yakalamayı başlatan ana fonksiyon. """
    print("🚀 Arka Plan: Paket yakalama motoru başlatılıyor...")
    ARAYUZ_ADI = "Wi-Fi" 
    print(f" dinlenecek ağ arayüzü: {ARAYUZ_ADI}")
    try:
        # Lambda testini kaldırıp orijinal process_packet'e geri dönüyoruz.
        sniff(iface=ARAYUZ_ADI, prn=process_packet, store=False, filter="ip")
    except Exception as e:
        print(f"\n❌ HATA (start_packet_capture): {e}")

# app.py içinde, mevcut get_anomaly_explanation fonksiyonunu bununla değiştirin.

def get_anomaly_explanation(flow_data):
    """
    Anomali olarak işaretlenen bir akış için insan tarafından okunabilir,
    kural tabanlı olası nedenler üretir. (KALİBRE EDİLMİŞ HALİ)
    """
    reasons = []
    
    # Kural 1: Paket oranı (rate) - Eşiği düşürdük
    if flow_data.get('rate', 0) > 100: # Eşik 1000'den 100'e düşürüldü
        reasons.append(f"Yüksek paket oranı ({flow_data['rate']:.0f} pps)")

    # Kural 2: Kaynak yükü (sload) - Eşiği dramatik şekilde düşürdük
    if flow_data.get('sload', 0) > 500000: # Eşik 20 Milyon'dan 500 Bin'e düşürüldü (0.5 Mbps)
        reasons.append(f"Yüksek kaynak veri yükü ({flow_data['sload']/1000000:.2f} Mbps)")

    # Kural 3: Kısa sürede veri gönderimi - Eşiği düşürdük
    if flow_data.get('dur', 1) < 2 and flow_data.get('sbytes', 0) > 4000: # Eşik 50KB'den 4KB'ye düşürüldü
        reasons.append("Kısa sürede yüksek hacimli veri gönderimi")
        
    # Kural 4: Paketler arası çok düşük varış zamanı
    # Bu kural LAN üzerinde çok hassas olabilir, şimdilik eşiği koruyalım.
    if flow_data.get('sinpkt', 0) > 0 and flow_data.get('sinpkt', 100) < 0.01:
        reasons.append("Paketler arası çok düşük varış zamanı")

    # Kural 5: Akış çok uzun sürüyorsa (Bu kural aynı kalabilir)
    if flow_data.get('dur', 0) > 300:
        reasons.append("Çok uzun süren bağlantı akışı")

    if not reasons:
        return "Model, özelliklerin genel bir kombinasyonuna dayanarak anomali tespit etti."
        
    return "Olası Neden(ler): " + ", ".join(reasons) + "."
# --- FLASK ROTALARI ---
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/stream')
def stream():
    """ Gerçek zamanlı veri akışını SSE üzerinden sunar. (DÜZELTİLMİŞ HALİ) """
    if model_pipeline is None:
        def error_stream():
            error_data = {"error": "Model yüklenemedi. Sunucu loglarını kontrol edin."}
            yield f"data: {json.dumps(error_data)}\n\n"
        return Response(error_stream(), mimetype='text/event-stream')

    def realtime_event_stream():
        print("🔗 İstemci bağlandı. Veri akışı başlıyor...")
        while True:
            try:
                # 1. Kuyruktan ham veriyi al ('proto': 'tcp' gibi metinlerle birlikte)
                flow_data_dict = data_queue.get()
                
                # 2. SADECE DataFrame'e dönüştür. Manuel ön işleme (get_dummies, reindex) YOK!
                live_df = pd.DataFrame([flow_data_dict])
                
                # 3. Ham DataFrame'i doğrudan 'akıllı' pipeline'a gönder.
                # Pipeline, ölçeklendirme ve one-hot-encoding gibi tüm adımları kendisi yapacak.
                probability_scores = model_pipeline.predict_proba(live_df)[0]
                
                # --- Buradan sonrası aynı ---
                normal_probability = probability_scores[0]
                anomaly_probability = probability_scores[1]
                
                prediction = 1 if anomaly_probability >= ANOMALY_THRESHOLD else 0
                
                explanation = ""
                if prediction == 1:
                    explanation = get_anomaly_explanation(flow_data_dict)

                result = {
                    'data': flow_data_dict,
                    'prediction': int(prediction),
                    'probability_anomaly': round(float(anomaly_probability), 3),
                    'probability_normal': round(float(normal_probability), 3),
                    'explanation': explanation
                }

                 # --- BU DEBUG SATIRINI GERİ EKLEYİN ---
                # Sadece anomali olabilecekleri görmek için bir if koşulu ekleyelim
                if anomaly_probability > 0.1: # Sadece %10'dan şüpheli olanları yazdır
                    print(f">>> MODEL TAHMİNİ: Anomali Olasılığı = {anomaly_probability:.3f}")
                # --- DEBUG KODU SONU ---
                
                yield f"data: {json.dumps(result)}\n\n"
                 # Eğer kuyrukta hala çok fazla veri bekliyorsa (örn: 50'den fazla),
                # arayüzün yetişebilmesi için çok kısa bir süre (örn: 50 milisaniye) bekle.
                # if data_queue.qsize() > 50:
                #     time.sleep(0.05) 

            except Exception as e:
                print(f"❌ HATA (stream fonksiyonu): {e}")
                if 'live_df' in locals():
                    print(f"🚨 Modele gönderilmeye çalışılan son veri: {live_df.to_dict()}")

    return Response(realtime_event_stream(), mimetype='text/event-stream')
    """ Gerçek zamanlı veri akışını SSE üzerinden sunar. """
    if model_pipeline is None:
        def error_stream():
            error_data = {"error": "Model yüklenemedi. Sunucu loglarını kontrol edin."}
            yield f"data: {json.dumps(error_data)}\n\n"
        return Response(error_stream(), mimetype='text/event-stream')

    def realtime_event_stream():
        print("🔗 İstemci bağlandı. Gerçek zamanlı veri akışı başlıyor...")
        while True:
            try:
                flow_data_dict = data_queue.get()
                live_df = pd.DataFrame([flow_data_dict])
                probability_scores = model_pipeline.predict_proba(live_df)[0]
                
                # live_df = pd.DataFrame([flow_data_dict])
                # live_df_encoded = pd.get_dummies(live_df)
                # live_df_aligned = live_df_encoded.reindex(columns=FINAL_MODEL_COLUMNS, fill_value=0)
                
                probability_scores = model_pipeline.predict_proba(live_df_aligned)[0]
                anomaly_probability = probability_scores[1]
                
                print(f"--- DEBUG: Karşılaştırma -> Olasılık: {anomaly_probability:.2f} >= Eşik: {ANOMALY_THRESHOLD} ? ---")
                
                prediction = 1 if anomaly_probability >= ANOMALY_THRESHOLD else 0
                
                explanation = ""
                if prediction == 1:
                    explanation = get_anomaly_explanation(flow_data_dict)

                result = {
                    'data': flow_data_dict,
                    'prediction': int(prediction),
                    'probability_anomaly': round(float(anomaly_probability), 3),
                    'probability_normal': round(float(normal_probability), 3),
                    'explanation': explanation
                }
                # --- EN KRİTİK DEBUG KODU BAŞLANGICI ---
                print("\n" + "-"*50)
                print(">>> SUNUCU TARAFINDAN GÖNDERİLMEDEN ÖNCEKİ VERİ (app.py) <<<")
                print("RESULT SÖZLÜĞÜ:", result)
                # Olasılık değerinin Python'daki tipini kontrol edelim
                if 'probability_anomaly' in result:
                    print("probability_anomaly'nin TİPİ:", type(result['probability_anomaly']))
                else:
                    print("DİKKAT: 'probability_anomaly' anahtarı result içinde bulunamadı!")
                print("-"*50)
                # --- DEBUG KODU SONU ---




                yield f"data: {json.dumps(result)}\n\n"

            except Exception as e:
                print(f"❌ HATA (stream fonksiyonu): {e}")
                if 'live_df_aligned' in locals():
                    print(f"🚨 Modele gönderilmeye çalışılan son hizalanmış veri: {live_df_aligned.to_dict()}")

    return Response(realtime_event_stream(), mimetype='text/event-stream')

# --- ANA PROGRAM BAŞLANGICI ---
if __name__ == '__main__':
    capture_thread = threading.Thread(target=start_packet_capture, daemon=True)
    timeout_thread = threading.Thread(target=timeout_checker, daemon=True)
    
    capture_thread.start()
    timeout_thread.start()

    app.run(debug=False, host='0.0.0.0', port=5000, threaded=True, use_reloader=False)