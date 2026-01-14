"""
URL configuration for taskmanager project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include, re_path
from rest_framework.authtoken.views import obtain_auth_token
from django.views.decorators.csrf import csrf_exempt
from django.views.static import serve
from django.conf import settings
from django.shortcuts import redirect

from django.urls import path, re_path, include
from django.views.static import serve
from django.conf import settings
from django.shortcuts import redirect
from finance.middleware import get_machine_id
from finance.models import License
from datetime import date
from finance.views import LogoutView

def index_view(request):
    # check if license exists
    machine_id = get_machine_id()
    license = License.objects.filter(
        machine_id=machine_id,
        is_active=True,
        expiry_date__gte=date.today()
    ).first()

    if not license:
        return redirect("/license/activate/")

    # license valid → serve index.html
    return serve(request, "index.html", document_root=settings.STATIC_ROOT)


urlpatterns = [
    # Admin
    path("admin/", admin.site.urls),

    # API routes
    path("api/", include("finance.urls")),
    path("api-auth/", include("rest_framework.urls")),
    path("license/activate/", include("finance.urls_license")),

    # Token auth
    path("api-token-auth/", csrf_exempt(obtain_auth_token)),
    path("logout/", csrf_exempt(LogoutView.as_view())), 

    # root path → check license
    path("", index_view),  # empty path `/` now serves index.html after license

    # SPA catch-all (other routes)
    re_path(
        r"^(?!api/|activate|api-auth/|api-token-auth/|admin/|staticfiles/|static).*",
        index_view,
    ),
]

urlpatterns += [
    re_path(
        r"^staticfiles/(?P<path>.*)$",
        serve,
        {"document_root": settings.STATIC_ROOT},
    ),
]
