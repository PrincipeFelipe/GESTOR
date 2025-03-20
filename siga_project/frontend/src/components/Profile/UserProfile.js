import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom'; // Añadir esta importación
import { 
    Container, 
    Paper, 
    Typography, 
    Grid, 
    TextField, 
    Button, 
    Box, 
    Avatar, 
    Divider, 
    CircularProgress,
    Snackbar,
    Alert
} from '@mui/material';
import { Person as PersonIcon, Edit as EditIcon, Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material';
import { AuthContext } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import usersService from '../../assets/services/users.service';

const UserProfile = () => {
    const navigate = useNavigate(); // Añadir esta línea
    const { currentUser, setCurrentUser } = useContext(AuthContext);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({});
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [openSnackbar, setOpenSnackbar] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const response = await usersService.getProfile();
            setProfile(response);
            setFormData({
                nombre: response.nombre,
                apellido1: response.apellido1,
                apellido2: response.apellido2 || '',
                email: response.email,
                telefono: response.telefono || '',
            });
        } catch (error) {
            console.error('Error al cargar perfil:', error);
            setError('Error al cargar el perfil. Intente nuevamente.');
            setOpenSnackbar(true);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleEdit = () => {
        setEditing(true);
    };

    const handleCancel = () => {
        setFormData({
            nombre: profile.nombre,
            apellido1: profile.apellido1,
            apellido2: profile.apellido2 || '',
            email: profile.email,
            telefono: profile.telefono || '',
        });
        setEditing(false);
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            const updatedUser = await usersService.update(profile.id, formData);
            setProfile({...profile, ...updatedUser});
            setEditing(false);
            setSuccess('Perfil actualizado correctamente');
            setOpenSnackbar(true);
            
            // Actualizar el contexto de autenticación si es necesario
            if (currentUser) {
                setCurrentUser({...currentUser, ...updatedUser});
            }
        } catch (error) {
            console.error('Error al actualizar perfil:', error);
            setError('Error al actualizar el perfil. Intente nuevamente.');
            setOpenSnackbar(true);
        } finally {
            setLoading(false);
        }
    };

    const handleCloseSnackbar = () => {
        setOpenSnackbar(false);
        setError(null);
        setSuccess(null);
    };

    if (loading && !profile) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="md">
            <Paper elevation={3} sx={{ p: 4, mt: 4, borderRadius: 2 }}>
                <Box display="flex" alignItems="center" mb={3}>
                    <Avatar 
                        sx={{ 
                            bgcolor: 'primary.main', 
                            width: 60, 
                            height: 60,
                            mr: 2 
                        }}
                    >
                        {profile?.nombre ? profile.nombre[0].toUpperCase() : <PersonIcon />}
                    </Avatar>
                    <Box>
                        <Typography variant="h4" color="primary.dark">
                            Mi Perfil
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {profile?.tipo_usuario} | {profile?.ref}
                        </Typography>
                    </Box>
                    {!editing ? (
                        <Button 
                            variant="outlined" 
                            startIcon={<EditIcon />} 
                            onClick={handleEdit}
                            sx={{ ml: 'auto' }}
                        >
                            Editar
                        </Button>
                    ) : (
                        <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
                            <Button 
                                variant="outlined" 
                                color="error"
                                startIcon={<CancelIcon />} 
                                onClick={handleCancel}
                            >
                                Cancelar
                            </Button>
                            <Button 
                                variant="contained" 
                                startIcon={<SaveIcon />} 
                                onClick={handleSave}
                            >
                                Guardar
                            </Button>
                        </Box>
                    )}
                </Box>

                <Divider sx={{ mb: 3 }} />

                <Grid container spacing={3}>
                    <Grid item xs={12} sm={4}>
                        <TextField
                            fullWidth
                            label="Nombre"
                            name="nombre"
                            value={formData.nombre}
                            onChange={handleChange}
                            disabled={!editing || loading}
                            variant={editing ? "outlined" : "filled"}
                        />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField
                            fullWidth
                            label="Primer Apellido"
                            name="apellido1"
                            value={formData.apellido1}
                            onChange={handleChange}
                            disabled={!editing || loading}
                            variant={editing ? "outlined" : "filled"}
                        />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField
                            fullWidth
                            label="Segundo Apellido"
                            name="apellido2"
                            value={formData.apellido2}
                            onChange={handleChange}
                            disabled={!editing || loading}
                            variant={editing ? "outlined" : "filled"}
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            disabled={!editing || loading}
                            variant={editing ? "outlined" : "filled"}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Teléfono"
                            name="telefono"
                            value={formData.telefono}
                            onChange={handleChange}
                            disabled={!editing || loading}
                            variant={editing ? "outlined" : "filled"}
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="TIP"
                            value={profile?.tip}
                            disabled
                            variant="filled"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Referencia"
                            value={profile?.ref}
                            disabled
                            variant="filled"
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Unidad"
                            value={profile?.unidad_details?.nombre || 'N/A'}
                            disabled
                            variant="filled"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Empleo"
                            value={profile?.empleo_details?.nombre || 'N/A'}
                            disabled
                            variant="filled"
                        />
                    </Grid>

                    {profile?.date_joined && (
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Fecha de registro"
                                value={format(new Date(profile.date_joined), 'dd/MM/yyyy HH:mm', { locale: es })}
                                disabled
                                variant="filled"
                            />
                        </Grid>
                    )}
                    {profile?.last_login && (
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Último inicio de sesión"
                                value={format(new Date(profile.last_login), 'dd/MM/yyyy HH:mm', { locale: es })}
                                disabled
                                variant="filled"
                            />
                        </Grid>
                    )}
                </Grid>

                <Box mt={4}>
                    <Typography variant="h6" color="primary.dark" gutterBottom>
                        Seguridad
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Button 
                        variant="outlined" 
                        color="primary"
                        onClick={() => navigate('/dashboard/cambiar-password')}
                    >
                        Cambiar Contraseña
                    </Button>
                </Box>
            </Paper>

            <Snackbar 
                open={openSnackbar} 
                autoHideDuration={6000} 
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert 
                    onClose={handleCloseSnackbar} 
                    severity={error ? "error" : "success"} 
                    sx={{ width: '100%' }}
                >
                    {error || success}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default UserProfile;