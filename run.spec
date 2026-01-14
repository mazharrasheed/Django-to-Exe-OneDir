# -*- mode: python ; coding: utf-8 -*-

from PyInstaller.utils.hooks import collect_submodules

hiddenimports = (
    collect_submodules('hotelfinancemanager') +
    collect_submodules('finance') +
    collect_submodules('whitenoise')
)

a = Analysis(
    ['run.py'],
    pathex=['D:/Coding/djando to exe'],
    binaries=[],
    datas=[
        ('hotelfinancemanager', 'hotelfinancemanager'),
        ('finance', 'finance'),
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
    strip=False,
    upx=True,
    console=False,
    name='FinanceFlow_app',
)