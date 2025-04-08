from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from unidades.models import Unidad
from empleos.models import Empleo
from django.db.models import Q

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
    
    # Unidad actual/principal a la que pertenece el usuario
    unidad = models.ForeignKey('unidades.Unidad', on_delete=models.SET_NULL, null=True, related_name='usuarios_asignados')
    
    # Nueva unidad de destino (puede ser diferente a la unidad principal)
    unidad_destino = models.ForeignKey('unidades.Unidad', on_delete=models.SET_NULL, null=True, 
                                      blank=True, related_name='usuarios_destinados',
                                      help_text="Unidad a la que el usuario está destinado temporalmente")
    
    # Nueva unidad de acceso para permisos especiales
    unidad_acceso = models.ForeignKey('unidades.Unidad', on_delete=models.SET_NULL, null=True, 
                                     blank=True, related_name='usuarios_con_acceso',
                                     help_text="Unidad adicional a la que el usuario tiene acceso")
    
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
    
    def get_unidades_accesibles(self):
        """
        Determina las unidades a las que el usuario tiene acceso, basado en su:
        1. Unidad principal
        2. Unidad de destino
        3. Unidad de acceso
        4. Tipo de usuario (si es Admin o SuperAdmin puede ver unidades dependientes)
        
        Retorna un QuerySet de unidades.
        """
        if self.is_superadmin:
            # SuperAdmin tiene acceso a todas las unidades
            return Unidad.objects.all()
        
        unidades_ids = set()
        unidades_base = []
        
        # Añadir las unidades directamente asignadas
        if self.unidad:
            unidades_base.append(self.unidad)
        if self.unidad_destino:
            unidades_base.append(self.unidad_destino)
        if self.unidad_acceso:
            unidades_base.append(self.unidad_acceso)
        
        # Para cada unidad base, determinar qué unidades adicionales son accesibles
        for unidad_base in unidades_base:
            unidades_ids.add(unidad_base.id)
            
            # Si es Admin o Gestor, incluir unidades dependientes según jerarquía
            if self.is_admin or self.is_gestor:
                # Buscar recursivamente todas las unidades dependientes
                dependientes = self._obtener_unidades_dependientes_recursivamente(unidad_base)
                unidades_ids.update(dependientes)
        
        # Si no hay unidades, devolver un QuerySet vacío
        if not unidades_ids:
            return Unidad.objects.none()
        
        # Devolver QuerySet con todas las unidades accesibles
        return Unidad.objects.filter(id__in=unidades_ids)
    
    def _obtener_unidades_dependientes_recursivamente(self, unidad):
        """Función auxiliar para obtener todos los IDs de unidades dependientes recursivamente"""
        result = set()
        # Buscar unidades que tienen a esta unidad como padre
        subunidades = Unidad.objects.filter(id_padre=unidad.id)
        
        for subunidad in subunidades:
            result.add(subunidad.id)
            # Recursión para obtener unidades dependientes de esta subunidad
            child_ids = self._obtener_unidades_dependientes_recursivamente(subunidad)
            result.update(child_ids)
            
        return result
    
    def puede_acceder_unidad(self, unidad_id):
        """Verifica si el usuario puede acceder a una unidad específica"""
        # SuperAdmin siempre tiene acceso
        if self.is_superadmin:
            return True
            
        # Obtener todas las unidades accesibles y comprobar si la unidad solicitada está entre ellas
        unidades_accesibles = self.get_unidades_accesibles()
        return unidades_accesibles.filter(id=unidad_id).exists()
    
    def puede_ver_procedimiento(self, procedimiento):
        """
        Determina si un usuario puede ver un procedimiento basado en:
        1. Si es SuperAdmin (puede ver todo)
        2. Si el nivel del procedimiento coincide con el tipo de alguna de sus unidades accesibles
        """
        # SuperAdmin puede ver todos los procedimientos
        if self.is_superadmin:
            return True
            
        # Si el procedimiento no tiene nivel definido, usar comprobación básica
        if not procedimiento.nivel:
            return True
            
        # Obtener tipos de unidades a las que tiene acceso
        unidades_accesibles = self.get_unidades_accesibles()
        tipos_unidades_accesibles = set(unidades_accesibles.values_list('tipo_unidad', flat=True))
        
        # Caso especial para unidades híbridas Zona-Comandancia
        if 'ZONA_COMANDANCIA' in tipos_unidades_accesibles:
            if procedimiento.nivel in ['ZONA', 'COMANDANCIA', 'ZONA_COMANDANCIA']:
                return True
        
        # Comprobar si el nivel del procedimiento coincide con algún tipo de unidad accesible
        return procedimiento.nivel in tipos_unidades_accesibles