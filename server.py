import http.server
import socketserver
import socket
import webbrowser
import os

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

def get_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('10.255.255.255', 1))
        IP = s.getsockname()[0]
    except Exception:
        IP = '127.0.0.1'
    finally:
        s.close()
    return IP

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

if __name__ == '__main__':
    local_ip = get_ip()
    print("=" * 60)
    print(" APLIKASI BAST & KUITANSI KAS DESA TANJUNG MANIS")
    print(" Khusus Kaur Keuangan - Kec. Sangkulirang")
    print("=" * 60)
    print(f"\n[+] Server Aktif di Port {PORT}")
    print(f"[+] Akses dari Komputer/Laptop : http://localhost:{PORT}")
    print(f"[+] Akses dari HP Android/iOS  : http://{local_ip}:{PORT}")
    print("\nPetunjuk Akses dari HP:")
    print(f"1. Pastikan HP dan Laptop terhubung di Wi-Fi / Hotspot yang sama.")
    print(f"2. Buka Google Chrome di HP Anda, lalu ketik alamat:")
    print(f"   --> http://{local_ip}:{PORT}")
    print(f"3. Di Chrome HP, ketuk titik 3 di kanan atas -> Pilih 'Tambahkan ke Layar Utama' (Add to Home Screen).")
    print("=" * 60)
    print("Tekan Ctrl+C untuk menutup server jika sudah selesai.\n")

    # Buka otomatis di browser laptop
    webbrowser.open(f"http://localhost:{PORT}")

    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer dihentikan.")
