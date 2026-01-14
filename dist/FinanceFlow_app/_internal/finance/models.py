from django.db import models
from django.contrib.auth.models import User
# Create your models here.


# class CustomPermissions(models.Model):
#     class Meta:
#         permissions = [
#             ('view_dashboard', 'Can view dashboard'),
#             ("view_balance_sheet", "Can view balance sheet"),
#             ("view_reports", "Can view reports"),
#             # Add more custom permissions here
#         ]


class SoftDeleteManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(is_deleted=False)

class SoftDeleteModel(models.Model):
    is_deleted = models.BooleanField(default=False)

    filtered = SoftDeleteManager()
    objects = models.Manager()

    class Meta:
        abstract = True

    def delete(self):
        self.is_deleted = True
        self.save()

    def hard_delete(self):
        super().delete()
import uuid
from django.db import models

class Project(SoftDeleteModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    createt_by = models.ForeignKey(User, on_delete=models.RESTRICT, null=True, blank=True)
    color = models.CharField(max_length=50) # Stores hsl or hex
    icon = models.CharField(max_length=50, default='Briefcase')

    class Meta:
        permissions = [
            ('data_backup', 'Can backup data'),
            ('view_dashboard', 'Can view dashboard'),
            ("view_balance_sheet", "Can view balance sheet"),
            ("view_reports", "Can view reports"),
            ("view_project_balance", "Can view blance"),
            ("view_project_investment", "Can view investment"),
            # Add more custom permissions here
        ]

    def __str__(self):
        return self.name
    
    

class Transaction(SoftDeleteModel):
    TYPES = (
        ('income', 'Income'),
        ('expense', 'Expense'),
        ('investment', 'Investment'),
        ('general', 'General'),
    )
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, related_name='transactions', on_delete=models.RESTRICT,null=True, blank=True)
    date = models.DateField() # Matches your ISO date format
    type = models.CharField(max_length=10, choices=TYPES)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    createt_by = models.ForeignKey(User, on_delete=models.RESTRICT, null=True, blank=True)
    note = models.TextField(blank=True)

    class Meta:
        ordering = ['-date']

class License(models.Model):
    license_key = models.CharField(max_length=64)
    machine_id = models.CharField(max_length=64)
    is_active = models.BooleanField(default=True)
    expiry_date = models.DateField( null=True, blank=True)