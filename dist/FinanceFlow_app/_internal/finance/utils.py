import uuid
import hashlib


def verify_license(key, machine_id):
    expected = hashlib.sha256(
        (machine_id + "SECRET_SALT").encode()
    ).hexdigest()[:16]
    return expected == key.replace('-', '')


def get_machine_id():
    mac = uuid.getnode()
    return hashlib.sha256(str(mac).encode()).hexdigest()


