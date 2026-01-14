from datetime import date
from django.shortcuts import redirect
from .models import License
from .utils import get_machine_id

EXEMPT_PATHS = (
    '/license/activate/',
    '/admin/',
    '/api/',
    '/api-auth/',
    '/api-token-auth/',
)

class LicenseMiddleware1:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Skip license check for exempt paths
        if any(request.path.startswith(p) for p in EXEMPT_PATHS):
            return self.get_response(request)

        # Check license
        machine_id = get_machine_id()
        license = License.objects.filter(
            machine_id=machine_id,
            is_active=True,
            expiry_date__gte=date.today()
        ).first()

        # Redirect to license activation if none found
        if not license:
            return redirect('/license/activate/')

        # License valid → continue
        return self.get_response(request)

class LicenseMiddleware:
    machine_id = get_machine_id()

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        path = request.path

        EXEMPT_PATHS = (
            "/license/activate/",
            "/license/activate/generate/",
            "/admin/",
            "/favicon.ico",
            # '/static/'
        )

        if any(path.startswith(p) for p in EXEMPT_PATHS):
            return self.get_response(request)

        if not License.objects.filter(is_active=True, machine_id=self.machine_id).exists():
            return redirect("/license/activate/")

        return self.get_response(request)
