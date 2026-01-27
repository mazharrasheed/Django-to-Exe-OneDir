from django.shortcuts import render

# Create your views here.


from .models import Project,Transaction,License
from .serializers import ProjectSerializer,UserSignupSerializer,TransactionSerializer,UserSerializer
from rest_framework.viewsets import ModelViewSet
from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.decorators import action
from rest_framework.permissions import DjangoObjectPermissions
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.contrib.auth.models import User,Permission,Group
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.utils.crypto import get_random_string
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.db.models import ProtectedError
import json
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import render, redirect
from datetime import date, timedelta
from .models import License
from .utils import verify_license, get_machine_id
from datetime import date
from django.shortcuts import render, redirect
from django.contrib import messages
from .models import License
from .utils import get_machine_id
from itsdangerous import URLSafeSerializer
from rest_framework.authtoken.models import Token


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            # Delete the token to force re-login
            request.user.auth_token.delete()
        except Exception:
            return Response({"detail": "No token found."}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"detail": "Successfully logged out."}, status=status.HTTP_200_OK)


def get_machine_id_view(request):
    return JsonResponse({"machine_id": get_machine_id()})

def check_license(request):
    machine_id = get_machine_id()
    license = License.objects.filter(
        machine_id=machine_id,
        is_active=True,
        # expiry_date__gte=date.today()
    ).first()
    if not license:
        return JsonResponse({"error": "License invalid"}, status=403)
    return JsonResponse({"status": "ok"})


SECRET_KEY = "thisisworldclassapp"
serializer = URLSafeSerializer(SECRET_KEY)

def generate_license(request):

    oldest_user = User.objects.order_by('date_joined').first()
    if not request.user.is_superuser or not request.user == oldest_user or not request.user.id==1:
        return JsonResponse({"error": "Unauthorized"}, status=403)
    
    if request.method == "POST":
        machine_id = request.POST.get("machine_id")
        expiry = request.POST.get("expiry")  # e.g., "2026-02-28"
        if not machine_id or not expiry:
            return JsonResponse({"error": "machine_id and expiry required"}, status=400)
        data = {
            "machine_id": machine_id,
            "expiry": expiry,
        }
        license_key = serializer.dumps(data)
        return JsonResponse({"license_key": license_key})
    # For GET request → render template
    return render(request, "license/generate_license.html")


SECRET_KEY = "YOUR_SECRET_KEY"
serializer = URLSafeSerializer(SECRET_KEY)

def activate_license(request):
    print('activate_license called')
    if request.method == "POST":
        license_key = request.POST.get("license_key")
        machine_id = get_machine_id()
        try:
            data = serializer.loads(license_key)
        except Exception:
            messages.error(request, "Invalid license key")
            return redirect('/license/activate/')
        if data["machine_id"] != machine_id:
            messages.error(request, "License key does not match this machine")
            print('data["machine_id"]',data["machine_id"])
            return redirect('/license/activate/')
        expiry = date.fromisoformat(data["expiry"])
        # if expiry < date.today():
        #     messages.error(request, "License has expired")
        #     print('expiry < date.today()')
            # return redirect('/license/activate/')
        # Save license in DB
        License.objects.update_or_create(
            machine_id=machine_id,license_key=license_key,
            # defaults={"is_active": True,}
            defaults={"is_active": True, "expiry_date": expiry}
        )
        messages.success(request, "License activated successfully")
        return redirect('/')  # redirect to home
    return render(request, 'license/activate.html')



def activate_license1(request):
    if request.method == "POST":
        key = request.POST.get("license_key")
        machine_id = get_machine_id()
        if verify_license(key, machine_id):
            License.objects.update_or_create(
                machine_id=machine_id,
                defaults={
                    "license_key": key,
                    "is_active": True,
                    "expiry_date": date.today() + timedelta(days=365),
                }
            )
            return redirect("/")
        return render(request, "license/activate.html", {
            "error": "Invalid license key"
        })
    return render(request, "license/activate.html")


class CustomAuthToken(ObtainAuthToken):
    permission_classes = [AllowAny]  # no auth needed

    @csrf_exempt
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)

    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        return Response({'token': token.key})


reset_tokens = {}  # simple in-memory store; use DB in production

@csrf_exempt
def forgot_password(request):
    if request.method == "POST":
        try:
            if request.content_type == "application/json":
                data = json.loads(request.body.decode("utf-8"))
            else:
                data = request.POST
            email = data.get("email")
            if not email:
                return JsonResponse({"error": "Email is required."}, status=400)
            
            print('reset_tokens')
            user = User.objects.get(email=email)
            token = get_random_string(32)
            reset_tokens[token] = user.username
            reset_link = f"{settings.FRONTEND_URL}/reset-password/{token}"
            send_mail(
                "Password Reset Request",
                f"Click here to reset your password: {reset_link}",
                settings.DEFAULT_FROM_EMAIL,
                [email],
                fail_silently=False,
            )
            return JsonResponse({"message": "Password reset link sent to your email."})
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON format."}, status=400)
        except User.DoesNotExist:
            return JsonResponse({"error": "Email not found."}, status=400)
    return JsonResponse({"error": "Invalid request method."}, status=400)

@csrf_exempt
def reset_password(request, token):
    if request.method == "POST":
        data = json.loads(request.body)
        new_password = data.get("new_password")
        username = reset_tokens.get(token)
        if not username:
            return JsonResponse({"error": "Invalid or expired token"}, status=400)
        user = User.objects.get(username=username)
        user.set_password(new_password)
        user.save()
        del reset_tokens[token]  # remove used token
        return JsonResponse({"message": "Password reset successful"})
    return JsonResponse({"error": "Invalid request"}, status=400)


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        user = request.user
        old_password = request.data.get("old_password")
        new_password1 = request.data.get("new_password1")
        new_password2 = request.data.get("new_password2")
        print(request.data)
        print(old_password, new_password1, new_password2)
        if not user.check_password(old_password):
            print('Old password is incorrect')
            return Response(
    {
        "errors": {
            "old_password": ["Old password is incorrect"]
        }
    },
    status=status.HTTP_400_BAD_REQUEST
)
        if new_password1 != new_password2:
            print('Passwords do not match')
            return Response(
    {
        "errors": {
            "new_password2": ["Passwords do not match"]
        }
    },
    status=status.HTTP_400_BAD_REQUEST
)
        try:
            validate_password(new_password1, user)
        except ValidationError as e:
            return Response(
                {
                    "errors": {
                        "new_password2": e.messages
                    }
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        user.set_password(new_password1)
        user.save()
        return Response(
            {"detail": "Password changed successfully"},
            status=status.HTTP_200_OK
        )


class UserProfileView(APIView):

    def get(self, request):
        users = User.objects.filter(username=request.user.username) 
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)
    
class UserListView(APIView):
    def get(self, request):
        if request.user.is_superuser:
            users = User.objects.all() 
        else:
            users = User.objects.filter(username=request.user)
        serializer = UserSignupSerializer(users, many=True)
        return Response(serializer.data)
    
class UserSignupView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = UserSignupSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            token, _ = Token.objects.get_or_create(user=user)
            return Response({
                'message': 'User created successfully!',
                'token': token.key
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().exclude(is_superuser=True)
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def list(self, request, *args, **kwargs):
        users = self.get_queryset()
        serializer = self.get_serializer(users, many=True)
        return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_permissions_view(request):
    user = request.user

    # -----------------------------
    # ✅ SUPERUSER: return ALL permissions
    # -----------------------------
    if user.is_superuser:
        perms = Permission.objects.select_related("content_type").all()
        permission_objects = [
            {
                "codename": perm.codename,
                "name": perm.name,
                "app_label": perm.content_type.app_label,
            }
            for perm in perms
        ]
        return Response({
            "username": user.username,
            "is_superuser": True,
            "permissions": permission_objects,
        })

    # -----------------------------
    # ✅ NORMAL USER: only assigned permissions
    # (filtered to finance,auth app)
    # -----------------------------
    user_perms = user.get_all_permissions()  # {"app_label.codename"}
    permission_objects = []

    for perm in user_perms:
        app_label, codename = perm.split(".")
        # Finance app → include all permissions
        if app_label == "finance":
            try:
                perm_obj = Permission.objects.get(
                    codename=codename,
                    content_type__app_label=app_label
                )
                permission_objects.append({
                    "codename": perm_obj.codename,
                    "name": perm_obj.name,
                    "app_label": app_label,
                })
            except Permission.DoesNotExist:
                pass
        # Auth app → include only user CRUD permissions
        elif app_label == "auth" and codename in ["add_user", "change_user", "delete_user", "view_user"]:
            try:
                perm_obj = Permission.objects.get(
                    codename=codename,
                    content_type__app_label=app_label
                )
                permission_objects.append({
                    "codename": perm_obj.codename,
                    "name": perm_obj.name,
                    "app_label": app_label,
                })
            except Permission.DoesNotExist:
                pass

# Now permission_objects contains all finance permissions + auth user CRUD permissions

    return Response({
        "username": user.username,
        "is_superuser": False,
        "permissions": permission_objects,
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_groups(request):
    groups = Group.objects.all()
    data = [{"id": g.id, "name": g.name} for g in groups]
    return Response(data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    return Response({
        'id': request.user.id,
        'first_name': request.user.first_name,
        'last_name': request.user.last_name,
        'username': request.user.username,
        'email': request.user.email,
        'is_superuser': request.user.is_superuser
    })


class ProjectViewSet(ModelViewSet):
    queryset = Project.filtered.all()
    serializer_class = ProjectSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(createt_by=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
   
    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            return Response(
                {
                    "code": "PROJECT_HAS_TRANSACTIONS",
                    "detail": "This project cannot be deleted because it has existing transactions."
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
from django.db.models import Q
        
class TransactionViewSet(viewsets.ModelViewSet):
    queryset = Transaction.filtered.all()
    serializer_class = TransactionSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(createt_by=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def get_queryset(self):
        # Allow filtering by project via URL: /api/transactions/?project_id=...
        queryset = Transaction.objects.filter(project__is_deleted=False)
        queryset = Transaction.objects.filter(
            Q(project__is_deleted=False) | Q(project__isnull=True)
                                                                        )
        project_id = self.request.query_params.get('project_id')
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        return queryset