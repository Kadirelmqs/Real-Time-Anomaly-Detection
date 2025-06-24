# test_sniff.py
from scapy.all import sniff, Scapy_Exception
import platform

def print_packet_summary(packet):
    """Yakalanan her paketin özetini yazdıran basit bir fonksiyon."""
    print(f"-> Paket Yakalandı: {packet.summary()}")

print("--- Basit Scapy Paket Yakalama Testi ---")
print("10 paket yakalanınca test otomatik olarak duracak.")
print("Lütfen şimdi bilgisayarınızda bir web sayfasını yenileyerek trafik oluşturun...")
print("-" * 40)

# --- KENDİ BİLGİSAYARINIZA GÖRE DÜZENLEYİN ---
# 'ipconfig' (Windows) veya 'ifconfig' (Linux) komutuyla doğru arayüz adınızı bulun.
# Bu adın TAM OLARAK DOĞRU olması çok önemli.
# Örnekler: "Wi-Fi", "Ethernet", "eth0", "en0", "Realtek Gaming GbE Family Controller"
ARAYUZ_TEST_ADI = "Wi-Fi" 
# ---------------------------------------------

try:
    # Belirtilen arayüzü dinle, 10 paket yakalayınca dur.
    sniff(iface=ARAYUZ_TEST_ADI, prn=print_packet_summary, count=10)
    
    print("-" * 40)
    print("\n✅ Test Başarılı! 10 paket yakalandı.")
    print("Scapy sisteminizde temel düzeyde çalışıyor gibi görünüyor.")

except Scapy_Exception as e:
    print(f"\n❌ HATA: Scapy bir istisna fırlattı: {e}")
    print("💡 İpucu: 'ARAYUZ_TEST_ADI' değişkeninin doğru olduğundan emin olun.")
    if platform.system() == "Windows":
        print("💡 Windows İpucu: Npcap kütüphanesinin doğru kurulduğundan emin olun (WinPcap uyumluluk modu ile).")

except Exception as e:
    print(f"\n❌ HATA: Bilinmeyen bir hata oluştu: {e}")

finally:
    print("\nTest tamamlandı.")