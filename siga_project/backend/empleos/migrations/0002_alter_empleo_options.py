# Generated by Django 5.1.7 on 2025-03-20 13:20

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('empleos', '0001_initial'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='empleo',
            options={'ordering': ['id'], 'verbose_name': 'Empleo', 'verbose_name_plural': 'Empleos'},
        ),
    ]
