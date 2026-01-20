# -*- mode: python ; coding: utf-8 -*-

from PyInstaller.utils.hooks import collect_submodules

hiddenimports = (
    collect_submodules('hotelfinancemanager') +
    collect_submodules('finance') +
    collect_submodules('whitenoise')
)

a = Analysis(
    ['run.py'],
    pathex=['D:/Coding/Django-to-Exe-OneDir'],
    binaries=[],
    datas=[
        
        ('templates', 'templates'),
        ('staticfiles', 'staticfiles'),
    ],
    hiddenimports=hiddenimports,
    runtime_hooks=['disable_autoreload.py'],
    noarchive=False,
)

pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    name='FinanceFlow',
    console=False,
    upx=True,
)
coll = COLLECT(
    exe,
    a.binaries,
    a.datas,
    strip=True,
    upx=True,
    console=False,
    name='FinanceFlow_app',
)