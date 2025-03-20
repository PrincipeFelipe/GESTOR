# Generated by Django 5.1.7 on 2025-03-19 15:12

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('empleos', '0001_initial'),
        ('unidades', '0001_initial'),
        ('users', '0002_alter_usuario_managers_remove_usuario_username_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='usuario',
            name='empleo',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to='empleos.empleo'),
        ),
        migrations.RemoveField(
            model_name='unidad',
            name='id_padre',
        ),
        migrations.AlterField(
            model_name='usuario',
            name='unidad',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to='unidades.unidad'),
        ),
        migrations.DeleteModel(
            name='Empleo',
        ),
        migrations.DeleteModel(
            name='Unidad',
        ),
    ]
