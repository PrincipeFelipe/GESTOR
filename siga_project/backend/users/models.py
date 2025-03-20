from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from unidades.models import Unidad
from empleos.models import Empleo

class UserManager(BaseUserManager):
    def create_user(self, email, tip, password=None, **extra_fields):
        if not email:
            raise ValueError('El Email es obligatorio')
        if not tip:
            raise ValueError('El TIP es obligatorio')
        
        email = self.normalize_email(email)
        user = self.model(email=email, tip=tip, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, tip, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('estado', True)
        extra_fields.setdefault('tipo_usuario', 'SuperAdmin')
        
        return self.create_user(email, tip, password, **extra_fields)

class Usuario(AbstractUser):
    # Opciones para el tipo de usuario
    SUPERADMIN = 'SuperAdmin'
    ADMIN = 'Admin'
    GESTOR = 'Gestor'
    USER = 'User'
    
    TIPO_USUARIO_CHOICES = [
        (SUPERADMIN, 'Super Administrador'),
        (ADMIN, 'Administrador'),
        (GESTOR, 'Gestor'),
        (USER, 'Usuario'),
    ]
    
    # Eliminar campos redundantes que ya no usaremos del AbstractUser
    username = None  # Eliminamos el username como campo obligatorio
    
    # Nuestros campos personalizados
    nombre = models.CharField(max_length=50)
    apellido1 = models.CharField(max_length=50)
    apellido2 = models.CharField(max_length=50, blank=True)
    ref = models.CharField(max_length=20, unique=True)
    telefono = models.CharField(max_length=15, blank=True)
    email = models.EmailField(unique=True)
    unidad = models.ForeignKey('unidades.Unidad', on_delete=models.SET_NULL, null=True)
    empleo = models.ForeignKey('empleos.Empleo', on_delete=models.SET_NULL, null=True)
    tip = models.CharField(max_length=10, unique=True)  # Usamos esto como identificador
    estado = models.BooleanField(default=True)
    tipo_usuario = models.CharField(
        max_length=15,
        choices=TIPO_USUARIO_CHOICES,
        default=USER,
    )
    
    # Definir el campo de inicio de sesión
    USERNAME_FIELD = 'tip'
    REQUIRED_FIELDS = ['email', 'nombre', 'apellido1']
    
    objects = UserManager()
    
    def __str__(self):
        return f"{self.nombre} {self.apellido1} {self.apellido2}".strip()
        
    def save(self, *args, **kwargs):
        # Generar referencia si no existe
        if not self.ref:
            iniciales = (self.nombre[0] if self.nombre else '') + \
                       (self.apellido1[0] if self.apellido1 else '') + \
                       (self.apellido2[0] if self.apellido2 else '')
            self.ref = iniciales.upper()
        super().save(*args, **kwargs)
        
    @property
    def is_superadmin(self):
        return self.tipo_usuario == self.SUPERADMIN
        
    @property
    def is_admin(self):
        return self.tipo_usuario == self.ADMIN or self.tipo_usuario == self.SUPERADMIN
        
    @property
    def is_gestor(self):
        return self.tipo_usuario == self.GESTOR or self.is_admin