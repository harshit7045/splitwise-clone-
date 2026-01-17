from django.db import models

# Create your models here.
from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    # We enforce unique emails (Django default allows duplicates)
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=150, blank=True)

    def __str__(self):
        return self.username