from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserSignupView,UserListView,UserProfileView,UserViewSet,current_user,user_permissions_view
from .views import ProjectViewSet, TransactionViewSet
from .views import (
  list_groups,ChangePasswordView,forgot_password,reset_password,activate_license,check_license
)

router = DefaultRouter()
router.register(r'projects', ProjectViewSet)
router.register(r'transactions', TransactionViewSet)
router.register(r'users', UserViewSet)


urlpatterns = [
    path("license/check/", check_license),
    path('', include(router.urls)),
    path('current_user/', current_user),
    path('change-password/', ChangePasswordView.as_view()),
    path("forgot-password/", forgot_password, name="forgot-password"),
    path("reset-password/<str:token>/", reset_password, name="reset-password"),
    path('signup/',UserSignupView.as_view(),name='singup' ),
    path('users/me/permissions/',user_permissions_view),
    path("groups/", list_groups),
]
