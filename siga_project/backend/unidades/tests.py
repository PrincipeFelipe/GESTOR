from django.test import TestCase
from .models import Unidad

class UnidadModelTest(TestCase):

    def setUp(self):
        Unidad.objects.create(nombre="Unidad 1", id_padre=None)
        Unidad.objects.create(nombre="Unidad 2", id_padre=1)

    def test_unidad_creation(self):
        unidad1 = Unidad.objects.get(nombre="Unidad 1")
        unidad2 = Unidad.objects.get(nombre="Unidad 2")
        self.assertEqual(unidad1.nombre, "Unidad 1")
        self.assertIsNone(unidad1.id_padre)
        self.assertEqual(unidad2.nombre, "Unidad 2")
        self.assertEqual(unidad2.id_padre, unidad1.id)

    def test_unidad_str(self):
        unidad = Unidad.objects.get(nombre="Unidad 1")
        self.assertEqual(str(unidad), "Unidad 1")