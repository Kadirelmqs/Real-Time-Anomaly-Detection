# saldırı_test.py

from scapy.all import IP, TCP, send
import random

def anormal_paket_gonder(ip, port, sayi=10):
    for i in range(sayi):
        paket = IP(dst=ip)/TCP(sport=random.randint(1024, 65535), dport=port, flags="S")
        send(paket, verbose=0)
        print(f"[{i+1}] SYN paketi gönderildi -> {ip}:{port}")

if __name__ == "__main__":
    hedef_ip = "192.168.1.3"  # Hedef IP'yi buraya yaz
    hedef_port = 80            # Web servisi portu örnek
    anormal_paket_gonder(hedef_ip, hedef_port, sayi=20)
