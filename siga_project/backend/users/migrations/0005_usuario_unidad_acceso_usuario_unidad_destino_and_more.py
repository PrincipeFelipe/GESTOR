# Generated by Django 5.1.7 on 2025-04-08 10:49

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('unidades', '0007_unidad_descripcion_unidad_fecha_actualizacion_and_more'),
        ('users', '0004_usuario_tipo_usuario'),
    ]

    operations = [
        migrations.AddField(
            model_name='usuario',
            name='unidad_acceso',
            field=models.ForeignKey(blank=True, help_text='Unidad adicional a la que el usuario tiene acceso', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='usuarios_con_acceso', to='unidades.unidad'),
        ),
        migrations.AddField(
            model_name='usuario',
            name='unidad_destino',
            field=models.ForeignKey(blank=True, help_text='Unidad a la que el usuario está destinado temporalmente', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='usuarios_destinados', to='unidades.unidad'),
        ),
        migrations.AlterField(
            model_name='usuario',
            name='unidad',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='usuarios_asignados', to='unidades.unidad'),
        ),
    ]
