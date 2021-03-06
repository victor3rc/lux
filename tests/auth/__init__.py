import lux

from lux import forms
from lux.extensions import odm

EXTENSIONS = ['lux.extensions.base',
              'lux.extensions.odm',
              'lux.extensions.rest',
              'lux.extensions.auth']

AUTHENTICATION_BACKENDS = ['lux.extensions.auth.TokenBackend']
