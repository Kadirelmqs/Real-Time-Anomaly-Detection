# ttl_test.py
from scapy.all import send, IP, ICMP

# Hedef olarak Google'ın genel DNS sunucusunu kullanalım.
target_ip = "8.8.8.8"

# Anormal derecede düşük bir TTL değeri belirliyoruz.
# Modelin bunu fark etmesi neredeyse kesin.
custom_ttl = 5 

print(f"'{target_ip}' adresine TTL={custom_ttl} ile tek bir ICMP (ping) paketi gönderiliyor...")

try:
    # IP katmanında hedefi ve TTL'i belirlediğimiz bir ICMP paketi oluşturuyoruz.
    packet = IP(dst=target_ip, ttl=custom_ttl) / ICMP()

    # Paketi gönderiyoruz.
    send(packet, verbose=0)

    print("✅ Paket başarıyla gönderildi. Web arayüzünü kontrol edin!")

except Exception as e:
    print(f"❌ Paket gönderilirken bir hata oluştu: {e}")
    print("Bu script'i yönetici (sudo/admin) olarak çalıştırmanız gerekebilir.")
    