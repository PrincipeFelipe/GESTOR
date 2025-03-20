import React, { useState, useContext } from 'react';
import { 
    Container, 
    Paper, 
    Typography, 
    TextField, 
    Button, 
    Box, 
    CircularProgress,
    Snackbar,
    Alert,
    IconButton,
    InputAdornment
} from '@mui/material';
import { 
    Visibility, 
    VisibilityOff, 
    LockOutlined as LockIcon,
    ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import usersService from '../../assets/services/users.service';
import { AuthContext } from '../../contexts/AuthContext'; // Importar el contexto de autenticación

const ChangePassword = () => {
    const [formData, setFormData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    const navigate = useNavigate();
    const { logout } = useContext(AuthContext); // Obtener la función logout del contexto

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validación básica
        if (!formData.current_password || !formData.new_password || !formData.confirm_password) {
            setError('Todos los campos son obligatorios');
            setOpenSnackbar(true);
            return;
        }
        
        if (formData.new_password !== formData.confirm_password) {
            setError('Las contraseñas nuevas no coinciden');
            setOpenSnackbar(true);
            return;
        }
        
        if (formData.new_password.length < 8) {
            setError('La contraseña debe tener al menos 8 caracteres');
            setOpenSnackbar(true);
            return;
        }
        
        try {
            setLoading(true);
            const response = await usersService.changePassword(formData);
            setSuccess('Contraseña actualizada correctamente. Se cerrará la sesión en breve.');
            setOpenSnackbar(true);
            
            // Limpiar el formulario
            setFormData({
                current_password: '',
                new_password: '',
                confirm_password: ''
            });
            
            // Cerrar sesión después de 3 segundos
            setTimeout(() => {
                logout(); // Usar la función de logout del contexto
                navigate('/login');
            }, 3000);
            
        } catch (error) {
            console.error('Error al cambiar contraseña:', error);
            setError(error.response?.data?.detail || 'Error al cambiar la contraseña. Intente nuevamente.');
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

    return (
        <Container maxWidth="sm">
            <Button 
                startIcon={<ArrowBackIcon />} 
                onClick={() => navigate('/dashboard/perfil')}
                sx={{ mt: 2 }}
            >
                Volver al perfil
            </Button>
            
            <Paper elevation={3} sx={{ p: 4, mt: 2, borderRadius: 2 }}>
                <Box display="flex" alignItems="center" mb={3}>
                    <Box 
                        sx={{
                            bgcolor: 'primary.main',
                            borderRadius: '50%',
                            p: 1.5,
                            mr: 2,
                            color: 'white'
                        }}
                    >
                        <LockIcon />
                    </Box>
                    <Typography variant="h5" color="primary.dark">
                        Cambiar Contraseña
                    </Typography>
                </Box>
                
                <Box component="form" onSubmit={handleSubmit}>
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Contraseña actual"
                        name="current_password"
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={formData.current_password}
                        onChange={handleChange}
                        disabled={loading}
                        required
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        edge="end"
                                    >
                                        {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                    />
                    
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Nueva contraseña"
                        name="new_password"
                        type={showNewPassword ? 'text' : 'password'}
                        value={formData.new_password}
                        onChange={handleChange}
                        disabled={loading}
                        required
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        edge="end"
                                    >
                                        {showNewPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                        helperText="La contraseña debe tener al menos 8 caracteres"
                    />
                    
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Confirmar nueva contraseña"
                        name="confirm_password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirm_password}
                        onChange={handleChange}
                        disabled={loading}
                        required
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        edge="end"
                                    >
                                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                    />
                    
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        color="primary"
                        disabled={loading}
                        sx={{ mt: 3 }}
                    >
                        {loading ? <CircularProgress size={24} /> : 'Cambiar Contraseña'}
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

export default ChangePassword;