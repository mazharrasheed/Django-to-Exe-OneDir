from rest_framework import serializers
from .models import Project,Transaction
from django.contrib.auth.models import User
import re
from rest_framework import serializers
from django.contrib.auth.models import User, Permission
from django.contrib.auth.models import Group
from .models import Project, Transaction


class UserSignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['id','username', 'password']

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("This username is already taken.")
        if not re.match(r'^[a-zA-Z0-9_.-]+$', value):
            raise serializers.ValidationError("Username can only contain letters, numbers, underscores, hyphens, and dots.")
        if len(value) < 5:
            raise serializers.ValidationError("Username must be at least 5 characters long.")
        return value

    def validate_password(self, value):
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters long.")
        if not re.search(r'[A-Z]', value):
            raise serializers.ValidationError("Password must contain at least one uppercase letter.")
        if not re.search(r'[a-z]', value):
            raise serializers.ValidationError("Password must contain at least one lowercase letter.")
        if not re.search(r'[0-9]', value):
            raise serializers.ValidationError("Password must contain at least one digit.")
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', value):
            raise serializers.ValidationError("Password must contain at least one special character.")
        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            # email=validated_data.get('email', ''),
            password=validated_data['password']
        )
        return user

from django.contrib.auth.models import Permission

class UserSerializer(serializers.ModelSerializer):
    permissions = serializers.ListField(
        child=serializers.CharField(), write_only=True, required=False
    )
    permission_details = serializers.SerializerMethodField(read_only=True)
    group_details = serializers.SerializerMethodField()
    groups = serializers.PrimaryKeyRelatedField(
        queryset=Group.objects.all(),
        many=True,
        required=False
    )

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "password",
            "groups",
            "permissions",
            "permission_details",
            "group_details",
            "first_name",
            "last_name",
        ]
        extra_kwargs = {
            "password": {"write_only": True, "required": False}   # ✓ Make optional
        }

    def validate(self, data):
        # Require password ONLY when creating new user
        if self.instance is None and not data.get("password"):
            raise serializers.ValidationError({
                "password": ["This field is required for new users."]
            })
        return data
    
    def get_group_details(self, obj):
        return [
            {"id": g.id, "name": g.name}
            for g in obj.groups.all()
    ]




    def get_permission_details(self, obj):
        permissions = []

        for perm in obj.get_all_permissions():
            app_label, codename = perm.split(".")

            perm_obj = (
                Permission.objects
                .filter(
                    codename=codename,
                    content_type__app_label=app_label
                )
                .first()   # 👈 KEY FIX
            )

            if perm_obj:
                permissions.append({
                    "app_label": app_label,
                    "codename": codename,
                    "name": perm_obj.name,
                })

        return permissions



    def create(self, validated_data):
        permissions = validated_data.pop("permissions", [])
        groups = validated_data.pop("groups", [])
        password = validated_data.pop("password")

        user = User(**validated_data)
        user.set_password(password)
        user.save()

        if groups:
            user.groups.set(groups)

        if permissions:
            perms_qs = Permission.objects.filter(codename__in=permissions)
            user.user_permissions.set(perms_qs)

        return user

    def update(self, instance, validated_data):
        permissions = validated_data.pop("permissions", None)
        groups = validated_data.pop("groups", None)
        password = validated_data.pop("password", None)

        if password:
            instance.set_password(password)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()

        if groups is not None:
            instance.groups.set(groups)

        if permissions is not None:
            perms_qs = Permission.objects.filter(codename__in=permissions)
            instance.user_permissions.set(perms_qs)

        return instance
    


class TransactionSerializer(serializers.ModelSerializer):
    project = serializers.PrimaryKeyRelatedField(
        queryset=Project.objects.all(),
        required=False,
        allow_null=True
    )

    class Meta:
        model = Transaction
        fields = '__all__'


class ProjectSerializer(serializers.ModelSerializer):
    # Optional: include transactions inside project data
    # transactions = TransactionSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = '__all__'