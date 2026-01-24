import os
import sys
import io
import webbrowser
from pathlib import Path

def fix_std_streams():
    if sys.stdout is None:
        sys.stdout = io.StringIO()
    if sys.stderr is None:
        sys.stderr = io.StringIO()

def get_base_dir():
    """
    Always return a persistent, writable directory.
    - ONEDIR  → exe folder
    - ONEFILE → exe folder (NOT temp)
    """
    if getattr(sys, 'frozen', False):
        return Path(sys.executable).parent
    return Path(__file__).resolve().parent

def main():
    fix_std_streams()

    BASE_DIR = get_base_dir()

    # Ensure persistent folders
    (BASE_DIR / "media").mkdir(exist_ok=True)
    (BASE_DIR / "staticfiles").mkdir(exist_ok=True)

    # Python path
    sys.path.insert(0, str(BASE_DIR))

    # Django settings
    os.environ.setdefault(
        "DJANGO_SETTINGS_MODULE",
        "hotelfinancemanager.settings"
    )

    # IMPORTANT: setup Django FIRST
    import django
    django.setup()
    
    import socket
    import webbrowser
    from django.contrib.auth import get_user_model
    from django.core.management import execute_from_command_line, call_command
    from django.core.management import call_command

    # Now migrations are safe
    call_command("migrate", interactive=False)
    User = get_user_model()
    if not User.objects.filter(is_superuser=True).exists():
        User.objects.create_superuser(
            username="mazhar",
            email="mazhar@example.com",
            password="paktel@paktel3410123"
        )

    def get_local_ip():
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        try:
            s.connect(("8.8.8.8", 80))
            return s.getsockname()[0]
        finally:
            s.close()

    webbrowser.open(f"http://{get_local_ip()}:8000")

    execute_from_command_line([
        "manage.py",
        "runserver",
        "0.0.0.0:8000",
        "--noreload",
    ])

    # webbrowser.open("http://127.0.0.1:8000")
    # execute_from_command_line([
    #     "manage.py",
    #     "runserver",
    #     "127.0.0.1:8000",
    #     "--noreload",
    # ])

if __name__ == "__main__":
    main()


# taskkill /f /im run.exe 2>nul  