import os
import shutil

from lux.utils import test
from lux.extensions.rest import UserMixin
from lux.extensions.content.models import Content, DataError

from . import PWD, remove_repo


class User(UserMixin):
    username = 'Test'


class TestContentModel(test.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.model = Content('tests', PWD, '')
        with open(os.path.join(PWD, 'index.md'), 'w') as fp:
            fp.write('\n'.join(('title: Index', '', 'Just an index')))
        with open(os.path.join(PWD, 'foo.md'), 'w') as fp:
            fp.write('\n'.join(('title: This is Foo', '', 'Just foo')))

    @classmethod
    def tearDownClass(cls):
        remove_repo()

    def test_initialization(self):
        # repo exist
        self.assertEqual(str(self.model.path), PWD)
        self.assertIsInstance(self.model, Content)

        # repo not exist
        pwd = os.path.join(PWD, 'repo_test')
        Content('Test', pwd)
        self.assertTrue(os.path.exists(pwd))

    def test_read(self):
        app = self.application()
        request = app.wsgi_request()
        content = self.model.read(request, 'foo')
        self.assertEqual(content._content, '<p>Just foo</p>')
        # try to read wrong file
        with self.assertRaises(DataError) as e:
            self.model.read(request, 'Not_exist')
        self.assertEqual(str(e.exception), 'Not_exist not available')

    def test_json(self):
        app = self.application()
        request = app.wsgi_request()
        content = self.model.read(request, 'foo')
        data = self.model.tojson(request, content)
        self.assertTrue(data)
        self.assertEqual(data['title'], 'This is foo')
        self.assertEqual(data['path'], 'foo')

    def test_all(self):
        app = self.application()
        request = app.wsgi_request()
        models = dict(((v['html_url'], v) for v in self.model.all(request)))
        host = request.get_host()
        self.assertIn('http://%s/tests/index' % host, models)
