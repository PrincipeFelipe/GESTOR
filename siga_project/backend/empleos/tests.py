from django.test import TestCase
from .models import Empleo

class EmpleoModelTest(TestCase):

    def setUp(self):
        Empleo.objects.create(nombre="Desarrollador", abreviatura="Dev")
        Empleo.objects.create(nombre="Diseñador", abreviatura="Des")

    def test_empleo_creation(self):
        empleo = Empleo.objects.get(nombre="Desarrollador")
        self.assertEqual(empleo.abreviatura, "Dev")

    def test_empleo_str(self):
        empleo = Empleo.objects.get(nombre="Diseñador")
        self.assertEqual(str(empleo), "Diseñador")