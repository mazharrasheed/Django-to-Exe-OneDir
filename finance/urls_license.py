from django.urls import path
from .views import activate_license, generate_license,get_machine_id_view

urlpatterns = [
    # Public activation URL (user enters key)
    path('', activate_license, name='activate_license'),

    # Admin API to generate keys
    path('generate/', generate_license, name='generate_license'),
    path('machine-id/', get_machine_id_view, name='get_machine_id'),
    
]
