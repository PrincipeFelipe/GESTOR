from django.test import TestCase
from .models import Usuario, Unidad, Empleo  # Cambiado de User a Usuario

class UserModelTest(TestCase):

    @classmethod
    def setUpTestData(cls):
        unidad = Unidad.objects.create(nombre='Unidad Test')
        empleo = Empleo.objects.create(nombre='Empleo Test', abreviatura='ET')
        Usuario.objects.create(  # Cambiado de User a Usuario
            nombre='Juan',
            apellido1='Pérez',
            apellido2='Gómez',
            ref='12345',
            telefono='555123456',
            email='juan.perez@example.com',
            unidad=unidad,
            empleo=empleo,
            tip='admin',
            password='password123',
            estado=True
        )

    def test_user_creation(self):
        user = Usuario.objects.get(id=1)  # Cambiado de User a Usuario
        self.assertEqual(user.nombre, 'Juan')
        self.assertEqual(user.apellido1, 'Pérez')
        self.assertEqual(user.apellido2, 'Gómez')
        self.assertEqual(user.ref, '12345')
        self.assertEqual(user.telefono, '555123456')
        self.assertEqual(user.email, 'juan.perez@example.com')
        self.assertEqual(user.unidad.nombre, 'Unidad Test')
        self.assertEqual(user.empleo.nombre, 'Empleo Test')
        self.assertEqual(user.tip, 'admin')
        self.assertTrue(user.estado)

    def test_user_update(self):
        user = Usuario.objects.get(id=1)  # Cambiado de User a Usuario
        user.nombre = 'Carlos'
        user.save()
        self.assertEqual(user.nombre, 'Carlos')

    def test_user_deletion(self):
        user = Usuario.objects.get(id=1)  # Cambiado de User a Usuario
        user.delete()
        with self.assertRaises(Usuario.DoesNotExist):  # Cambiado de User a Usuario
            Usuario.objects.get(id=1)  # Cambiado de User a Usuario

class UnidadModelTest(TestCase):

    @classmethod
    def setUpTestData(cls):
        Unidad.objects.create(nombre='Unidad Test')

    def test_unidad_creation(self):
        unidad = Unidad.objects.get(id=1)
        self.assertEqual(unidad.nombre, 'Unidad Test')

class EmpleoModelTest(TestCase):

    @classmethod
    def setUpTestData(cls):
        Empleo.objects.create(nombre='Empleo Test', abreviatura='ET')

    def test_empleo_creation(self):
        empleo = Empleo.objects.get(id=1)
        self.assertEqual(empleo.nombre, 'Empleo Test')
        self.assertEqual(empleo.abreviatura, 'ET')