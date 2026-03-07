export type LanguageCode = 'en' | 'es' | 'fr' | 'pt';

type TranslationKeys =
  | 'homeSubtitle'
  | 'homeCaptain'
  | 'homeTraveler'
  | 'languageTitle'
  | 'navAccess'
  | 'navTrips'
  | 'navTripDetail'
  | 'navCreateTrip'
  | 'navProfile'
  | 'navBoats'
  | 'navBookings'
  | 'navUsers'
  | 'navMessages'
  | 'tripListCreate'
  | 'tripListProfile'
  | 'tripListAvailable'
  | 'tripListLoadError'
  | 'tripListRetry'
  | 'tripListEmptyTitle'
  | 'tripListEmptyText'
  | 'tripListDateMissing'
  | 'tripListSeats'
  | 'tripDetailLoadError'
  | 'tripDetailRetry'
  | 'tripDetailConnectionHelp'
  | 'tripDetailDateMissing'
  | 'tripDetailRoute'
  | 'tripDetailDeparture'
  | 'tripDetailSeats'
  | 'tripDetailPrice'
  | 'tripDetailStatus'
  | 'statusActive'
  | 'statusCompleted'
  | 'statusCancelled'
  | 'createTripTitle'
  | 'createTripFieldTitle'
  | 'createTripFieldOrigin'
  | 'createTripFieldDestination'
  | 'createTripFieldDate'
  | 'createTripFieldSeats'
  | 'createTripFieldPrice'
  | 'createTripSave'
  | 'createTripSaving'
  | 'alertMissingTitle'
  | 'alertMissingMessage'
  | 'alertInvalidTitle'
  | 'alertInvalidSeats'
  | 'alertInvalidPrice'
  | 'alertInvalidFormatTitle'
  | 'alertInvalidFormatMessage'
  | 'alertOkTitle'
  | 'alertCreateSuccess'
  | 'alertErrorTitle'
  | 'alertCreateError'
  | 'authRegister'
  | 'authLogin'
  | 'authName'
  | 'authEmail'
  | 'authContinue'
  | 'authProcessing'
  | 'authHaveAccount'
  | 'authNoAccount'
  | 'authRequiredTitle'
  | 'authRequiredMessage'
  | 'authErrorMessage'
  | 'profileTitle'
  | 'profileName'
  | 'profileEmail'
  | 'profileRole'
  | 'profileLogout'
  | 'profileLogoutTitle'
  | 'profileLogoutMessage'
  | 'profileCancel'
  | 'profileConfirm'
  | 'roleCaptain'
  | 'roleTraveler'
  | 'goHome'
  | 'createTripPurposeTitle'
  | 'createTripPurposeOrigin'
  | 'createTripPurposeDestination'
  | 'createTripPurposeDate'
  | 'createTripPurposeSeats'
  | 'createTripPurposePrice'
  | 'profileLoadError'
  | 'profileSave'
  | 'profileSaving'
  | 'profileSaved'
  | 'profileBio'
  | 'profileBoatName'
  | 'profileBoatType'
  | 'profileBoatDetails'
  | 'profileSkillsGeneral'
  | 'profileSkillsLanguages'
  | 'profileSkillsCleaning'
  | 'levelBeginner'
  | 'levelIntermediate'
  | 'levelExpert'
  | 'profileRating'
  | 'profileReviews'
  | 'boatsTitle'
  | 'boatsAdd'
  | 'boatsEdit'
  | 'boatPhoto'
  | 'boatCharacteristics'
  | 'boatSafety'
  | 'boatDepartureTimes'
  | 'boatDepartureTimesHelp'
  | 'boatSafetyEquipment'
  | 'boatCapacity'
  | 'boatFeatures'
  | 'rateTrip'
  | 'ratePassenger'
  | 'rateComment'
  | 'rateSubmit'
  | 'rateCancel'
  | 'ratingOutOf';

export const translations: Record<LanguageCode, Record<TranslationKeys, string>> = {
  en: {
    homeSubtitle: 'A new travel experience',
    homeCaptain: 'I am Captain',
    homeTraveler: 'I am Traveler',
    languageTitle: 'Language',
    navAccess: 'Access',
    navTrips: 'Trips',
    navTripDetail: 'Detail',
    navCreateTrip: 'Create Trip',
    navProfile: 'Profile',
    navBoats: 'Boats',
    navBookings: 'Bookings',
    navUsers: 'Users',
    navMessages: 'Messages',
    tripListCreate: '+ Create trip',
    tripListProfile: 'Profile',
    tripListAvailable: 'Available trips',
    tripListLoadError: 'Could not load trips. Please try again.',
    tripListRetry: 'Retry',
    tripListEmptyTitle: 'No trips available',
    tripListEmptyText: 'Published trips will appear here',
    tripListDateMissing: 'Date not set',
    tripListSeats: 'seats',
    tripDetailLoadError: 'Could not load trip.',
    tripDetailRetry: 'Retry',
    tripDetailConnectionHelp: 'Check your connection and try again',
    tripDetailDateMissing: 'Date not set',
    tripDetailRoute: 'Route',
    tripDetailDeparture: 'Departure',
    tripDetailSeats: 'Seats',
    tripDetailPrice: 'Price',
    tripDetailStatus: 'Status',
    statusActive: 'Active',
    statusCompleted: 'Completed',
    statusCancelled: 'Cancelled',
    createTripTitle: 'Create new trip',
    createTripFieldTitle: 'Title',
    createTripFieldOrigin: 'Origin',
    createTripFieldDestination: 'Destination',
    createTripFieldDate: 'Departure date (YYYY-MM-DD HH:mm)',
    createTripFieldSeats: 'Seats',
    createTripFieldPrice: 'Price',
    createTripSave: 'Create trip',
    createTripSaving: 'Saving...',
    alertMissingTitle: 'Missing data',
    alertMissingMessage: 'Complete title, origin and destination',
    alertInvalidTitle: 'Invalid value',
    alertInvalidSeats: 'Seats must be a number greater than or equal to 1',
    alertInvalidPrice: 'Price must be a number greater than or equal to 0',
    alertInvalidFormatTitle: 'Invalid format',
    alertInvalidFormatMessage: 'Date/time format: YYYY-MM-DD HH:mm (e.g. 2026-03-10 10:00)',
    alertOkTitle: 'Done',
    alertCreateSuccess: 'Trip created successfully',
    alertErrorTitle: 'Error',
    alertCreateError: 'Could not create trip. Check data and try again.',
    authRegister: 'Register',
    authLogin: 'Login',
    authName: 'Name',
    authEmail: 'Email',
    authContinue: 'Continue',
    authProcessing: 'Processing...',
    authHaveAccount: 'Already have an account? Sign in',
    authNoAccount: "Don’t have an account? Sign up",
    authRequiredTitle: 'Required fields',
    authRequiredMessage: 'Complete the data to continue',
    authErrorMessage: 'Could not complete access. Check your data and try again.',
    profileTitle: 'My profile',
    profileName: 'Name',
    profileEmail: 'Email',
    profileRole: 'Role',
    profileLogout: 'Sign out',
    profileLogoutTitle: 'Sign out',
    profileLogoutMessage: 'Are you sure you want to sign out?',
    profileCancel: 'Cancel',
    profileConfirm: 'Sign out',
    roleCaptain: 'Captain',
    roleTraveler: 'Traveler',
    goHome: 'Home',
    createTripPurposeTitle: 'What is this trip about?',
    createTripPurposeOrigin: 'Where does it depart from?',
    createTripPurposeDestination: 'Where does it arrive?',
    createTripPurposeDate: 'When does it depart?',
    createTripPurposeSeats: 'How many seats are available?',
    createTripPurposePrice: 'Price per person (€)',
    profileLoadError: 'Could not load profile data.',
    profileSave: 'Save profile',
    profileSaving: 'Saving...',
    profileSaved: 'Profile updated successfully.',
    profileBio: 'About me',
    profileBoatName: 'Boat name',
    profileBoatType: 'Boat type',
    profileBoatDetails: 'Boat characteristics',
    profileSkillsGeneral: 'General skills (comma-separated)',
    profileSkillsLanguages: 'Languages (comma-separated)',
    profileSkillsCleaning: 'Cleaning level',
    levelBeginner: 'Beginner',
    levelIntermediate: 'Intermediate',
    levelExpert: 'Expert',
    profileRating: 'Rating',
    profileReviews: 'Reviews',
    boatsTitle: 'My boats',
    boatsAdd: 'Add boat',
    boatsEdit: 'Edit boat',
    boatPhoto: 'Boat photo',
    boatCharacteristics: 'Characteristics (type, size, amenities)',
    boatSafety: 'Safety equipment (life jackets, first aid, etc)',
    boatDepartureTimes: 'Typical departure times',
    boatDepartureTimesHelp: '(e.g., "Monday-Friday 08:00, Saturday-Sunday 09:00")',
    boatSafetyEquipment: 'Safety info',
    boatCapacity: 'Capacity (seats)',
    boatFeatures: 'Amenities',
    rateTrip: 'Rate this trip',
    ratePassenger: 'How would you rate this passenger?',
    rateComment: 'Comment (optional)',
    rateSubmit: 'Submit rating',
    rateCancel: 'Cancel',
    ratingOutOf: 'out of 5',
  },
  es: {
    homeSubtitle: 'Una nueva experiencia de viaje',
    homeCaptain: 'Soy Patrón',
    homeTraveler: 'Soy Viajero',
    languageTitle: 'Idioma',
    navAccess: 'Acceso',
    navTrips: 'Viajes',
    navTripDetail: 'Detalle',
    navCreateTrip: 'Crear viaje',
    navProfile: 'Perfil',
    navBoats: 'Barcos',
    navBookings: 'Reservas',
    navUsers: 'Usuarios',
    navMessages: 'Mensajes',
    tripListCreate: '+ Crear viaje',
    tripListProfile: 'Perfil',
    tripListAvailable: 'Viajes disponibles',
    tripListLoadError: 'No se pudieron cargar los viajes. Intenta nuevamente.',
    tripListRetry: 'Reintentar',
    tripListEmptyTitle: 'No hay viajes disponibles',
    tripListEmptyText: 'Los viajes publicados aparecerán aquí',
    tripListDateMissing: 'Fecha no definida',
    tripListSeats: 'asientos',
    tripDetailLoadError: 'No se pudo cargar el viaje.',
    tripDetailRetry: 'Reintentar',
    tripDetailConnectionHelp: 'Verifica tu conexión e intenta nuevamente',
    tripDetailDateMissing: 'Fecha no definida',
    tripDetailRoute: 'Ruta',
    tripDetailDeparture: 'Salida',
    tripDetailSeats: 'Asientos',
    tripDetailPrice: 'Precio',
    tripDetailStatus: 'Estado',
    statusActive: 'Activo',
    statusCompleted: 'Completado',
    statusCancelled: 'Cancelado',
    createTripTitle: 'Crear nuevo viaje',
    createTripFieldTitle: 'Título',
    createTripFieldOrigin: 'Origen',
    createTripFieldDestination: 'Destino',
    createTripFieldDate: 'Fecha salida (YYYY-MM-DD HH:mm)',
    createTripFieldSeats: 'Asientos',
    createTripFieldPrice: 'Precio',
    createTripSave: 'Crear viaje',
    createTripSaving: 'Guardando...',
    alertMissingTitle: 'Faltan datos',
    alertMissingMessage: 'Completa título, origen y destino',
    alertInvalidTitle: 'Dato inválido',
    alertInvalidSeats: 'Asientos debe ser un número mayor o igual a 1',
    alertInvalidPrice: 'Precio debe ser un número mayor o igual a 0',
    alertInvalidFormatTitle: 'Formato inválido',
    alertInvalidFormatMessage: 'Fecha y hora: YYYY-MM-DD HH:mm (ej: 2026-03-10 10:00)',
    alertOkTitle: 'Listo',
    alertCreateSuccess: 'Viaje creado correctamente',
    alertErrorTitle: 'Error',
    alertCreateError: 'No se pudo crear el viaje. Revisa los datos e intenta nuevamente.',
    authRegister: 'Registro',
    authLogin: 'Login',
    authName: 'Nombre',
    authEmail: 'Email',
    authContinue: 'Continuar',
    authProcessing: 'Procesando...',
    authHaveAccount: '¿Ya tienes cuenta? Inicia sesión',
    authNoAccount: '¿No tienes cuenta? Regístrate',
    authRequiredTitle: 'Campos requeridos',
    authRequiredMessage: 'Completa los datos para continuar',
    authErrorMessage: 'No se pudo completar el acceso. Verifica tus datos e intenta nuevamente.',
    profileTitle: 'Mi perfil',
    profileName: 'Nombre',
    profileEmail: 'Email',
    profileRole: 'Rol',
    profileLogout: 'Cerrar sesión',
    profileLogoutTitle: 'Cerrar sesión',
    profileLogoutMessage: '¿Seguro que deseas salir?',
    profileCancel: 'Cancelar',
    profileConfirm: 'Salir',
    roleCaptain: 'Patrón',
    roleTraveler: 'Viajero',
    goHome: 'Inicio',
    createTripPurposeTitle: '¿Para qué es este viaje?',
    createTripPurposeOrigin: '¿Desde dónde sale?',
    createTripPurposeDestination: '¿A dónde llega?',
    createTripPurposeDate: '¿Cuándo sale?',
    createTripPurposeSeats: '¿Cuántos asientos hay disponibles?',
    createTripPurposePrice: 'Precio por persona (€)',
    profileLoadError: 'No se pudo cargar la información del perfil.',
    profileSave: 'Guardar perfil',
    profileSaving: 'Guardando...',
    profileSaved: 'Perfil actualizado correctamente.',
    profileBio: 'Sobre mí',
    profileBoatName: 'Nombre del barco',
    profileBoatType: 'Tipo de barco',
    profileBoatDetails: 'Características del barco',
    profileSkillsGeneral: 'Habilidades generales (separadas por coma)',
    profileSkillsLanguages: 'Idiomas (separados por coma)',
    profileSkillsCleaning: 'Nivel de limpieza',
    levelBeginner: 'Principiante',
    levelIntermediate: 'Intermedio',
    levelExpert: 'Experto',
    profileRating: 'Calificación',
    profileReviews: 'Comentarios',
    boatsTitle: 'Mis barcos',
    boatsAdd: 'Agregar barco',
    boatsEdit: 'Editar barco',
    boatPhoto: 'Foto del barco',
    boatCharacteristics: 'Características (tipo, tamaño, amenidades)',
    boatSafety: 'Equipo de seguridad (chalecos, botiquín, etc)',
    boatDepartureTimes: 'Horarios de salida típicos',
    boatDepartureTimesHelp: '(ej: "Lunes-Viernes 08:00, Sábado-Domingo 09:00")',
    boatSafetyEquipment: 'Información de seguridad',
    boatCapacity: 'Capacidad (asientos)',
    boatFeatures: 'Amenidades',
    rateTrip: 'Calificar este viaje',
    ratePassenger: '¿Cómo calificarías a este viajero?',
    rateComment: 'Comentario (opcional)',
    rateSubmit: 'Enviar calificación',
    rateCancel: 'Cancelar',
    ratingOutOf: 'de 5',
  },
  fr: {
    homeSubtitle: 'Une nouvelle expérience de voyage',
    homeCaptain: 'Je suis Capitaine',
    homeTraveler: 'Je suis Voyageur',
    languageTitle: 'Langue',
    navAccess: 'Accès',
    navTrips: 'Voyages',
    navTripDetail: 'Détail',
    navCreateTrip: 'Créer un voyage',
    navProfile: 'Profil',
    navBoats: 'Bateaux',
    navBookings: 'Réservations',
    navUsers: 'Utilisateurs',
    navMessages: 'Messages',
    tripListCreate: '+ Créer un voyage',
    tripListProfile: 'Profil',
    tripListAvailable: 'Voyages disponibles',
    tripListLoadError: 'Impossible de charger les voyages. Réessayez.',
    tripListRetry: 'Réessayer',
    tripListEmptyTitle: 'Aucun voyage disponible',
    tripListEmptyText: 'Les voyages publiés apparaîtront ici',
    tripListDateMissing: 'Date non définie',
    tripListSeats: 'places',
    tripDetailLoadError: 'Impossible de charger le voyage.',
    tripDetailRetry: 'Réessayer',
    tripDetailConnectionHelp: 'Vérifiez votre connexion et réessayez',
    tripDetailDateMissing: 'Date non définie',
    tripDetailRoute: 'Itinéraire',
    tripDetailDeparture: 'Départ',
    tripDetailSeats: 'Places',
    tripDetailPrice: 'Prix',
    tripDetailStatus: 'Statut',
    statusActive: 'Actif',
    statusCompleted: 'Terminé',
    statusCancelled: 'Annulé',
    createTripTitle: 'Créer un nouveau voyage',
    createTripFieldTitle: 'Titre',
    createTripFieldOrigin: 'Origine',
    createTripFieldDestination: 'Destination',
    createTripFieldDate: 'Date de départ (YYYY-MM-DD HH:mm)',
    createTripFieldSeats: 'Places',
    createTripFieldPrice: 'Prix',
    createTripSave: 'Créer un voyage',
    createTripSaving: 'Enregistrement...',
    alertMissingTitle: 'Données manquantes',
    alertMissingMessage: 'Renseignez le titre, l’origine et la destination',
    alertInvalidTitle: 'Valeur invalide',
    alertInvalidSeats: 'Les places doivent être un nombre supérieur ou égal à 1',
    alertInvalidPrice: 'Le prix doit être un nombre supérieur ou égal à 0',
    alertInvalidFormatTitle: 'Format invalide',
    alertInvalidFormatMessage: 'Format date/heure : YYYY-MM-DD HH:mm (ex: 2026-03-10 10:00)',
    alertOkTitle: 'Terminé',
    alertCreateSuccess: 'Voyage créé avec succès',
    alertErrorTitle: 'Erreur',
    alertCreateError: 'Impossible de créer le voyage. Vérifiez les données et réessayez.',
    authRegister: 'Inscription',
    authLogin: 'Connexion',
    authName: 'Nom',
    authEmail: 'E-mail',
    authContinue: 'Continuer',
    authProcessing: 'Traitement...',
    authHaveAccount: 'Vous avez déjà un compte ? Connectez-vous',
    authNoAccount: 'Vous n’avez pas de compte ? Inscrivez-vous',
    authRequiredTitle: 'Champs requis',
    authRequiredMessage: 'Complétez les données pour continuer',
    authErrorMessage: 'Impossible de terminer l’accès. Vérifiez vos données et réessayez.',
    profileTitle: 'Mon profil',
    profileName: 'Nom',
    profileEmail: 'E-mail',
    profileRole: 'Rôle',
    profileLogout: 'Se déconnecter',
    profileLogoutTitle: 'Se déconnecter',
    profileLogoutMessage: 'Voulez-vous vraiment vous déconnecter ?',
    profileCancel: 'Annuler',
    profileConfirm: 'Sortir',
    roleCaptain: 'Capitaine',
    roleTraveler: 'Voyageur',
    goHome: 'Accueil',
    createTripPurposeTitle: 'À quoi sert ce voyage ?',
    createTripPurposeOrigin: 'D’où part-il ?',
    createTripPurposeDestination: 'Où arrive-t-il ?',
    createTripPurposeDate: 'Quand part-il ?',
    createTripPurposeSeats: 'Combien de places sont disponibles ?',
    createTripPurposePrice: 'Prix par personne (€)',
    profileLoadError: 'Impossible de charger les données du profil.',
    profileSave: 'Enregistrer le profil',
    profileSaving: 'Enregistrement...',
    profileSaved: 'Profil mis à jour avec succès.',
    profileBio: 'À propos de moi',
    profileBoatName: 'Nom du bateau',
    profileBoatType: 'Type de bateau',
    profileBoatDetails: 'Caractéristiques du bateau',
    profileSkillsGeneral: 'Compétences générales (séparées par des virgules)',
    profileSkillsLanguages: 'Langues (séparées par des virgules)',
    profileSkillsCleaning: 'Niveau de nettoyage',
    levelBeginner: 'Débutant',
    levelIntermediate: 'Intermédiaire',
    levelExpert: 'Expert',
    profileRating: 'Note',
    profileReviews: 'Avis',
    boatsTitle: 'Mes bateaux',
    boatsAdd: 'Ajouter bateau',
    boatsEdit: 'Modifier bateau',
    boatPhoto: 'Photo du bateau',
    boatCharacteristics: 'Caractéristiques (type, taille, équipements)',
    boatSafety: 'Équipement de sécurité (gilets de sauvetage, trousse de premiers secours, etc)',
    boatDepartureTimes: 'Horaires de départ typiques',
    boatDepartureTimesHelp: '(par ex: "Lundi-Vendredi 08:00, Samedi-Dimanche 09:00")',
    boatSafetyEquipment: 'Équipement de sécurité',
    boatCapacity: 'Capacité',
    boatFeatures: 'Caractéristiques',
    rateTrip: 'Évaluer ce voyage',
    ratePassenger: 'Comment évaluez-vous ce passager ?',
    rateComment: 'Commentaire (facultatif)',
    rateSubmit: 'Soumettre l\'évaluation',
    rateCancel: 'Annuler',
    ratingOutOf: 'sur 5',
  },
  pt: {
    homeSubtitle: 'Uma nova experiência de viagem',
    homeCaptain: 'Sou Capitão',
    homeTraveler: 'Sou Viajante',
    languageTitle: 'Idioma',
    navAccess: 'Acesso',
    navTrips: 'Viagens',
    navTripDetail: 'Detalhe',
    navCreateTrip: 'Criar viagem',
    navProfile: 'Perfil',
    navBoats: 'Barcos',
    navBookings: 'Reservas',
    navUsers: 'Usuários',
    navMessages: 'Mensagens',
    tripListCreate: '+ Criar viagem',
    tripListProfile: 'Perfil',
    tripListAvailable: 'Viagens disponíveis',
    tripListLoadError: 'Não foi possível carregar as viagens. Tente novamente.',
    tripListRetry: 'Tentar novamente',
    tripListEmptyTitle: 'Não há viagens disponíveis',
    tripListEmptyText: 'As viagens publicadas aparecerão aqui',
    tripListDateMissing: 'Data não definida',
    tripListSeats: 'assentos',
    tripDetailLoadError: 'Não foi possível carregar a viagem.',
    tripDetailRetry: 'Tentar novamente',
    tripDetailConnectionHelp: 'Verifique sua conexão e tente novamente',
    tripDetailDateMissing: 'Data não definida',
    tripDetailRoute: 'Rota',
    tripDetailDeparture: 'Saída',
    tripDetailSeats: 'Assentos',
    tripDetailPrice: 'Preço',
    tripDetailStatus: 'Status',
    statusActive: 'Ativo',
    statusCompleted: 'Concluído',
    statusCancelled: 'Cancelado',
    createTripTitle: 'Criar nova viagem',
    createTripFieldTitle: 'Título',
    createTripFieldOrigin: 'Origem',
    createTripFieldDestination: 'Destino',
    createTripFieldDate: 'Data de saída (YYYY-MM-DD HH:mm)',
    createTripFieldSeats: 'Assentos',
    createTripFieldPrice: 'Preço',
    createTripSave: 'Criar viagem',
    createTripSaving: 'Salvando...',
    alertMissingTitle: 'Faltam dados',
    alertMissingMessage: 'Preencha título, origem e destino',
    alertInvalidTitle: 'Valor inválido',
    alertInvalidSeats: 'Assentos deve ser um número maior ou igual a 1',
    alertInvalidPrice: 'Preço deve ser um número maior ou igual a 0',
    alertInvalidFormatTitle: 'Formato inválido',
    alertInvalidFormatMessage: 'Data e hora: YYYY-MM-DD HH:mm (ex: 2026-03-10 10:00)',
    alertOkTitle: 'Pronto',
    alertCreateSuccess: 'Viagem criada com sucesso',
    alertErrorTitle: 'Erro',
    alertCreateError: 'Não foi possível criar a viagem. Revise os dados e tente novamente.',
    authRegister: 'Cadastro',
    authLogin: 'Entrar',
    authName: 'Nome',
    authEmail: 'E-mail',
    authContinue: 'Continuar',
    authProcessing: 'Processando...',
    authHaveAccount: 'Já tem conta? Faça login',
    authNoAccount: 'Não tem conta? Cadastre-se',
    authRequiredTitle: 'Campos obrigatórios',
    authRequiredMessage: 'Preencha os dados para continuar',
    authErrorMessage: 'Não foi possível concluir o acesso. Verifique seus dados e tente novamente.',
    profileTitle: 'Meu perfil',
    profileName: 'Nome',
    profileEmail: 'E-mail',
    profileRole: 'Função',
    profileLogout: 'Sair',
    profileLogoutTitle: 'Sair',
    profileLogoutMessage: 'Tem certeza que deseja sair?',
    profileCancel: 'Cancelar',
    profileConfirm: 'Sair',
    roleCaptain: 'Capitão',
    roleTraveler: 'Viajante',
    goHome: 'Início',
    createTripPurposeTitle: 'Para que é esta viagem?',
    createTripPurposeOrigin: 'De onde sai?',
    createTripPurposeDestination: 'Para onde chega?',
    createTripPurposeDate: 'Quando sai?',
    createTripPurposeSeats: 'Quantos assentos estão disponíveis?',
    createTripPurposePrice: 'Preço por pessoa (€)',
    profileLoadError: 'Não foi possível carregar os dados do perfil.',
    profileSave: 'Salvar perfil',
    profileSaving: 'Salvando...',
    profileSaved: 'Perfil atualizado com sucesso.',
    profileBio: 'Sobre mim',
    profileBoatName: 'Nome do barco',
    profileBoatType: 'Tipo de barco',
    profileBoatDetails: 'Características do barco',
    profileSkillsGeneral: 'Habilidades gerais (separadas por vírgula)',
    profileSkillsLanguages: 'Idiomas (separados por vírgula)',
    profileSkillsCleaning: 'Nível de limpeza',
    levelBeginner: 'Iniciante',
    levelIntermediate: 'Intermediário',
    levelExpert: 'Especialista',
    profileRating: 'Classificação',
    profileReviews: 'Avaliações',
    boatsTitle: 'Meus barcos',
    boatsAdd: 'Adicionar barco',
    boatsEdit: 'Editar barco',
    boatPhoto: 'Foto do barco',
    boatCharacteristics: 'Características (tipo, tamanho, comodidades)',
    boatSafety: 'Equipamento de segurança (coletes salva-vidas, kit primeiro-socorro, etc)',
    boatDepartureTimes: 'Horários de partida típicos',
    boatDepartureTimesHelp: '(ex: "Segunda a Sexta 08:00, Sábado-Domingo 09:00")',
    boatSafetyEquipment: 'Equipamento de segurança',
    boatCapacity: 'Capacidade',
    boatFeatures: 'Características',
    rateTrip: 'Avaliar esta viagem',
    ratePassenger: 'Como você avaliaria este passageiro?',
    rateComment: 'Comentário (opcional)',
    rateSubmit: 'Enviar avaliação',
    rateCancel: 'Cancelar',
    ratingOutOf: 'de 5',
  },
};
