import lux
from lux import Html

from .ui import add_css


__all__ = ['add_css']


class Extension(lux.Extension):
    '''${project_name} extension
    '''
    def middleware(self, app):
        return [Router('/')]


class Router(lux.Router):

    def get_html(self, request):
        return Html('div', '<p>Well done, $project_name is created!</p>')
