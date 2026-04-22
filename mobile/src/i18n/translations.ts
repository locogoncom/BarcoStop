export type LanguageCode = 'en' | 'es' | 'fr' | 'pt';

type TranslationKeys =
  | 'homeSubtitle'
  | 'homeAnimateSailor'
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
  | 'tripListCreateRegatta'
  | 'tripListProfile'
  | 'tripListAvailable'
  | 'tripListSearchExpand'
  | 'tripListSearchCollapse'
  | 'tripListSearchHint'
  | 'tripListSearchPortButton'
  | 'tripListSearchPortValueEmpty'
  | 'tripListSearchOriginPlaceholder'
  | 'tripListSearchDestinationPlaceholder'
  | 'tripListSearchDatePlaceholder'
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
  | 'createRegattaTitle'
  | 'createTripModeTrip'
  | 'createTripModeRegatta'
  | 'createTripFieldTitle'
  | 'createTripFieldOrigin'
  | 'createTripFieldDestination'
  | 'createTripFieldDate'
  | 'createTripFieldSeats'
  | 'createTripFieldPrice'
  | 'createTripSave'
  | 'createRegattaSave'
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
  | 'authPassword'
  | 'authConfirmPassword'
  | 'authContinue'
  | 'authProcessing'
  | 'authHaveAccount'
  | 'authNoAccount'
  | 'authRequiredTitle'
  | 'authRequiredMessage'
  | 'authPasswordMismatchTitle'
  | 'authPasswordMismatchMessage'
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
  | 'profileSaveError'
  | 'profileAvatarOpenError'
  | 'profileAvatarReadError'
  | 'profileAvatarFormatError'
  | 'profileAvatarTooLarge'
  | 'profileAvatarSelectError'
  | 'profileAvatarUploadError'
  | 'profileSkillsGeneral'
  | 'profileSkillsLanguages'
  | 'profileSkillsCleaning'
  | 'levelBeginner'
  | 'levelIntermediate'
  | 'levelExpert'
  | 'profileRating'
  | 'profileReviews'
  | 'profilePhotoTitle'
  | 'profileChooseGallery'
  | 'profileAvatarHint'
  | 'profileRatingTitle'
  | 'profileMyRating'
  | 'profileCommentsCount'
  | 'profileUserComments'
  | 'profileAnonymousUser'
  | 'profileDateUnavailable'
  | 'profileDonationThanks'
  | 'profileDonateButton'
  | 'profileDonateTitle'
  | 'profileDonatePrompt'
  | 'profileDonateSmall'
  | 'profileDonateMedium'
  | 'profileDonationConfirmTitle'
  | 'profileDonationConfirmMessage'
  | 'profileDonationRecorded'
  | 'profileDonationRecordFailed'
  | 'profileImproveButton'
  | 'profileImproveTitle'
  | 'profileImproveSubtitle'
  | 'profileImproveInputLabel'
  | 'profileImproveInputPlaceholder'
  | 'profileImproveSend'
  | 'profileImproveSending'
  | 'profileImproveEmpty'
  | 'profileImproveDelete'
  | 'profileImproveDeleteTitle'
  | 'profileImproveDeleteMessage'
  | 'profileImproveDeleted'
  | 'profileImproveSent'
  | 'profileImproveLoadError'
  | 'profileImproveSendError'
  | 'profileImproveDeleteError'
  | 'profileImproveReplyTitle'
  | 'profileImproveStatusOpen'
  | 'profileImproveStatusAnswered'
  | 'profileImproveStatusClosed'
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
  | 'tripKindTrip'
  | 'tripKindRegatta'
  | 'regattaJoin'
  | 'regattaJoined'
  | 'regattaParticipantsTitle'
  | 'regattaParticipantsEmpty'
  | 'regattaOnlyCaptains'
  | 'ratePassenger'
  | 'rateComment'
  | 'rateSubmit'
  | 'rateCancel'
  | 'ratingOutOf';

export const translations: Record<LanguageCode, Record<TranslationKeys, string>> = {
  en: {
    homeSubtitle: 'A new travel experience',
    homeAnimateSailor: 'Animate sailor!!!!',
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
    tripListCreateRegatta: '+ Create regatta',
    tripListProfile: 'Profile',
    tripListAvailable: 'Available trips',
    tripListSearchExpand: 'More filters',
    tripListSearchCollapse: 'Hide filters',
    tripListSearchHint: 'Tap origin to expand destination and date filters.',
    tripListSearchPortButton: 'Departure port',
    tripListSearchPortValueEmpty: 'Choose origin',
    tripListSearchOriginPlaceholder: 'Origin',
    tripListSearchDestinationPlaceholder: 'Destination',
    tripListSearchDatePlaceholder: 'Date (e.g. 2026-03-06)',
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
    createRegattaTitle: 'Create new regatta',
    createTripModeTrip: 'Trip',
    createTripModeRegatta: 'Regatta',
    createTripFieldTitle: 'Title',
    createTripFieldOrigin: 'Origin',
    createTripFieldDestination: 'Destination',
    createTripFieldDate: 'Departure date (YYYY-MM-DD HH:mm)',
    createTripFieldSeats: 'Seats',
    createTripFieldPrice: 'Price',
    createTripSave: 'Create trip',
    createRegattaSave: 'Create regatta',
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
    authPassword: 'Password',
    authConfirmPassword: 'Confirm password',
    authContinue: 'Continue',
    authProcessing: 'Processing...',
    authHaveAccount: 'Already have an account? Sign in',
    authNoAccount: "Don’t have an account? Sign up",
    authRequiredTitle: 'Required fields',
    authRequiredMessage: 'Complete the data to continue',
    authPasswordMismatchTitle: 'Password confirmation',
    authPasswordMismatchMessage: 'Passwords do not match.',
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
    profileSaveError: 'Could not save the profile.',
    profileAvatarOpenError: 'Could not open the gallery.',
    profileAvatarReadError: 'Could not read the selected photo.',
    profileAvatarFormatError: 'Unsupported format. Choose a JPG, PNG or WEBP photo.',
    profileAvatarTooLarge: 'The photo is too large (max 5MB). Choose a smaller image.',
    profileAvatarSelectError: 'Could not select the photo.',
    profileAvatarUploadError: 'Could not upload the avatar.',
    profileSkillsGeneral: 'General skills (comma-separated)',
    profileSkillsLanguages: 'Languages (comma-separated)',
    profileSkillsCleaning: 'Cleaning level',
    levelBeginner: 'Beginner',
    levelIntermediate: 'Intermediate',
    levelExpert: 'Expert',
    profileRating: 'Rating',
    profileReviews: 'Reviews',
    profilePhotoTitle: 'Profile photo',
    profileChooseGallery: 'Choose from gallery',
    profileAvatarHint: 'Pick a photo from your gallery.',
    profileRatingTitle: 'Rating',
    profileMyRating: 'My rating',
    profileCommentsCount: 'comments',
    profileUserComments: 'User comments',
    profileAnonymousUser: 'Anonymous user',
    profileDateUnavailable: 'Date unavailable',
    profileDonationThanks: 'Thanks for inviting the BarcoStop team to a coffee or beer.',
    profileDonateButton: 'Donate with PayPal',
    profileDonateTitle: 'PayPal donation',
    profileDonatePrompt: 'Thanks for supporting the BarcoStop team. Minimum donation: €2.50',
    profileDonateSmall: 'Donate €2.50',
    profileDonateMedium: 'Donate €5.00',
    profileDonationConfirmTitle: 'Confirm donation',
    profileDonationConfirmMessage: 'Did you complete the donation of €{{amount}} in PayPal?',
    profileDonationRecorded: 'Donation of €{{amount}} recorded',
    profileDonationRecordFailed: 'We could not register the donation automatically.',
    profileImproveButton: 'How can we improve?',
    profileImproveTitle: 'How can we improve?',
    profileImproveSubtitle: 'Send your suggestions to BarcoStop. Your messages stay here and our replies will appear in this same section.',
    profileImproveInputLabel: 'Your message',
    profileImproveInputPlaceholder: 'Tell us what should work better, what you miss, or what confused you.',
    profileImproveSend: 'Send to BarcoStop',
    profileImproveSending: 'Sending...',
    profileImproveEmpty: 'You have not sent any suggestions yet.',
    profileImproveDelete: 'Delete',
    profileImproveDeleteTitle: 'Delete message',
    profileImproveDeleteMessage: 'Do you want to delete this message? This action cannot be undone.',
    profileImproveDeleted: 'Message deleted.',
    profileImproveSent: 'Your suggestion was sent correctly.',
    profileImproveLoadError: 'We could not load your improvement messages.',
    profileImproveSendError: 'We could not send your message to BarcoStop.',
    profileImproveDeleteError: 'We could not delete the message.',
    profileImproveReplyTitle: 'BarcoStop reply',
    profileImproveStatusOpen: 'Open',
    profileImproveStatusAnswered: 'Answered',
    profileImproveStatusClosed: 'Closed',
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
    tripKindTrip: 'Trip',
    tripKindRegatta: 'Regatta',
    regattaJoin: 'Join regatta',
    regattaJoined: 'Joined regatta',
    regattaParticipantsTitle: 'Captains joining',
    regattaParticipantsEmpty: 'No captains have joined yet.',
    regattaOnlyCaptains: 'Regattas are for captains only.',
    ratePassenger: 'How would you rate this passenger?',
    rateComment: 'Comment (optional)',
    rateSubmit: 'Submit rating',
    rateCancel: 'Cancel',
    ratingOutOf: 'out of 5',
  },
  es: {
    homeSubtitle: 'Una nueva experiencia de viaje',
    homeAnimateSailor: 'Animate marinero!!!!',
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
    tripListCreateRegatta: '+ Crear regata',
    tripListProfile: 'Perfil',
    tripListAvailable: 'Viajes disponibles',
    tripListSearchExpand: 'Mas filtros',
    tripListSearchCollapse: 'Ocultar filtros',
    tripListSearchHint: 'Toca origen para desplegar destino y fecha.',
    tripListSearchPortButton: 'Puerto de salida',
    tripListSearchPortValueEmpty: 'Elige origen',
    tripListSearchOriginPlaceholder: 'Origen',
    tripListSearchDestinationPlaceholder: 'Destino',
    tripListSearchDatePlaceholder: 'Fecha (ej: 2026-03-06)',
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
    createRegattaTitle: 'Crear nueva regata',
    createTripModeTrip: 'Viaje',
    createTripModeRegatta: 'Regata',
    createTripFieldTitle: 'Nombre del viaje',
    createTripFieldOrigin: 'Puerto de salida',
    createTripFieldDestination: 'Puerto de llegada',
    createTripFieldDate: 'Fecha salida (YYYY-MM-DD HH:mm)',
    createTripFieldSeats: 'Asientos disponibles',
    createTripFieldPrice: 'Precio por persona (€)',
    createTripSave: 'Crear viaje',
    createRegattaSave: 'Crear regata',
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
    authPassword: 'Contraseña',
    authConfirmPassword: 'Confirmar contraseña',
    authContinue: 'Continuar',
    authProcessing: 'Procesando...',
    authHaveAccount: '¿Ya tienes cuenta? Inicia sesión',
    authNoAccount: '¿No tienes cuenta? Regístrate',
    authRequiredTitle: 'Campos requeridos',
    authRequiredMessage: 'Completa los datos para continuar',
    authPasswordMismatchTitle: 'Confirmación de contraseña',
    authPasswordMismatchMessage: 'Las contraseñas no coinciden.',
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
    profileSaveError: 'No se pudo guardar el perfil.',
    profileAvatarOpenError: 'No se pudo abrir la galeria.',
    profileAvatarReadError: 'No se pudo obtener la foto seleccionada.',
    profileAvatarFormatError: 'Formato no compatible. Elige una foto JPG, PNG o WEBP.',
    profileAvatarTooLarge: 'La foto es muy pesada (máx 5MB). Elige una foto más liviana.',
    profileAvatarSelectError: 'No se pudo seleccionar la foto.',
    profileAvatarUploadError: 'No se pudo subir el avatar.',
    profileSkillsGeneral: 'Habilidades generales (separadas por coma)',
    profileSkillsLanguages: 'Idiomas (separados por coma)',
    profileSkillsCleaning: 'Nivel de limpieza',
    levelBeginner: 'Principiante',
    levelIntermediate: 'Intermedio',
    levelExpert: 'Experto',
    profileRating: 'Calificación',
    profileReviews: 'Comentarios',
    profilePhotoTitle: 'Foto de perfil',
    profileChooseGallery: 'Elegir de galeria',
    profileAvatarHint: 'Elige una foto desde tu galeria.',
    profileRatingTitle: 'Puntuación',
    profileMyRating: 'Mi puntuación',
    profileCommentsCount: 'comentarios',
    profileUserComments: 'Comentarios de usuarios',
    profileAnonymousUser: 'Usuario anónimo',
    profileDateUnavailable: 'Fecha no disponible',
    profileDonationThanks: 'Gracias por invitar al equipo BarcoStop, una birra o café.',
    profileDonateButton: 'Donar con PayPal',
    profileDonateTitle: 'Donación PayPal',
    profileDonatePrompt: 'Gracias por tu apoyo al equipo BarcoStop. Mínimo de donación: €2.50',
    profileDonateSmall: 'Donar €2.50',
    profileDonateMedium: 'Donar €5.00',
    profileDonationConfirmTitle: 'Confirmar donación',
    profileDonationConfirmMessage: '¿Completaste la donación de €{{amount}} en PayPal?',
    profileDonationRecorded: 'Donación de €{{amount}} registrada',
    profileDonationRecordFailed: 'No pudimos registrar la donación automáticamente.',
    profileImproveButton: '¿En qué podemos mejorar?',
    profileImproveTitle: '¿En qué podemos mejorar?',
    profileImproveSubtitle: 'Envía tus sugerencias a BarcoStop. Tus mensajes quedarán aquí y nuestras respuestas aparecerán en esta misma sección.',
    profileImproveInputLabel: 'Tu mensaje',
    profileImproveInputPlaceholder: 'Cuéntanos qué debería funcionar mejor, qué echas de menos o qué te confundió.',
    profileImproveSend: 'Enviar a BarcoStop',
    profileImproveSending: 'Enviando...',
    profileImproveEmpty: 'Todavía no has enviado ninguna sugerencia.',
    profileImproveDelete: 'Eliminar',
    profileImproveDeleteTitle: 'Eliminar mensaje',
    profileImproveDeleteMessage: '¿Quieres eliminar este mensaje? Esta acción no se puede deshacer.',
    profileImproveDeleted: 'Mensaje eliminado.',
    profileImproveSent: 'Tu sugerencia se envió correctamente.',
    profileImproveLoadError: 'No pudimos cargar tus mensajes de mejora.',
    profileImproveSendError: 'No pudimos enviar tu mensaje a BarcoStop.',
    profileImproveDeleteError: 'No pudimos eliminar el mensaje.',
    profileImproveReplyTitle: 'Respuesta de BarcoStop',
    profileImproveStatusOpen: 'Abierto',
    profileImproveStatusAnswered: 'Respondido',
    profileImproveStatusClosed: 'Cerrado',
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
    tripKindTrip: 'Viaje',
    tripKindRegatta: 'Regata',
    regattaJoin: 'Unirme a la regata',
    regattaJoined: 'Ya unido a la regata',
    regattaParticipantsTitle: 'Capitanes apuntados',
    regattaParticipantsEmpty: 'Aun no se ha unido ningun capitan.',
    regattaOnlyCaptains: 'Las regatas son solo para capitanes.',
    ratePassenger: '¿Cómo calificarías a este viajero?',
    rateComment: 'Comentario (opcional)',
    rateSubmit: 'Enviar calificación',
    rateCancel: 'Cancelar',
    ratingOutOf: 'de 5',
  },
  fr: {
    homeSubtitle: 'Une nouvelle expérience de voyage',
    homeAnimateSailor: 'Anime marin!!!!',
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
    tripListCreateRegatta: '+ Créer une régate',
    tripListProfile: 'Profil',
    tripListAvailable: 'Voyages disponibles',
    tripListSearchExpand: 'Plus de filtres',
    tripListSearchCollapse: 'Masquer les filtres',
    tripListSearchHint: 'Touchez l’origine pour afficher destination et date.',
    tripListSearchPortButton: 'Port de depart',
    tripListSearchPortValueEmpty: 'Choisir l origine',
    tripListSearchOriginPlaceholder: 'Origine',
    tripListSearchDestinationPlaceholder: 'Destination',
    tripListSearchDatePlaceholder: 'Date (ex : 2026-03-06)',
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
    createRegattaTitle: 'Créer une nouvelle régate',
    createTripModeTrip: 'Voyage',
    createTripModeRegatta: 'Régate',
    createTripFieldTitle: 'Titre',
    createTripFieldOrigin: 'Origine',
    createTripFieldDestination: 'Destination',
    createTripFieldDate: 'Date de départ (YYYY-MM-DD HH:mm)',
    createTripFieldSeats: 'Places',
    createTripFieldPrice: 'Prix',
    createTripSave: 'Créer un voyage',
    createRegattaSave: 'Créer une régate',
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
    authPassword: 'Mot de passe',
    authConfirmPassword: 'Confirmer le mot de passe',
    authContinue: 'Continuer',
    authProcessing: 'Traitement...',
    authHaveAccount: 'Vous avez déjà un compte ? Connectez-vous',
    authNoAccount: 'Vous n’avez pas de compte ? Inscrivez-vous',
    authRequiredTitle: 'Champs requis',
    authRequiredMessage: 'Complétez les données pour continuer',
    authPasswordMismatchTitle: 'Confirmation du mot de passe',
    authPasswordMismatchMessage: 'Les mots de passe ne correspondent pas.',
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
    profileSaveError: 'Impossible d’enregistrer le profil.',
    profileAvatarOpenError: 'Impossible d’ouvrir la galerie.',
    profileAvatarReadError: 'Impossible de récupérer la photo sélectionnée.',
    profileAvatarFormatError: 'Format non compatible. Choisissez une photo JPG, PNG ou WEBP.',
    profileAvatarTooLarge: 'La photo est trop lourde (max 5 Mo). Choisissez une image plus légère.',
    profileAvatarSelectError: 'Impossible de sélectionner la photo.',
    profileAvatarUploadError: 'Impossible d’envoyer l’avatar.',
    profileSkillsGeneral: 'Compétences générales (séparées par des virgules)',
    profileSkillsLanguages: 'Langues (séparées par des virgules)',
    profileSkillsCleaning: 'Niveau de nettoyage',
    levelBeginner: 'Débutant',
    levelIntermediate: 'Intermédiaire',
    levelExpert: 'Expert',
    profileRating: 'Note',
    profileReviews: 'Avis',
    profilePhotoTitle: 'Photo de profil',
    profileChooseGallery: 'Choisir dans la galerie',
    profileAvatarHint: 'Choisissez une photo depuis votre galerie.',
    profileRatingTitle: 'Évaluation',
    profileMyRating: 'Ma note',
    profileCommentsCount: 'commentaires',
    profileUserComments: 'Commentaires des utilisateurs',
    profileAnonymousUser: 'Utilisateur anonyme',
    profileDateUnavailable: 'Date indisponible',
    profileDonationThanks: 'Merci d’offrir un café ou une bière à l’équipe BarcoStop.',
    profileDonateButton: 'Faire un don avec PayPal',
    profileDonateTitle: 'Don PayPal',
    profileDonatePrompt: 'Merci pour votre soutien à l’équipe BarcoStop. Don minimum : 2,50 €',
    profileDonateSmall: 'Donner 2,50 €',
    profileDonateMedium: 'Donner 5,00 €',
    profileDonationConfirmTitle: 'Confirmer le don',
    profileDonationConfirmMessage: 'Avez-vous terminé le don de €{{amount}} sur PayPal ?',
    profileDonationRecorded: 'Don de €{{amount}} enregistré',
    profileDonationRecordFailed: 'Impossible d’enregistrer automatiquement le don.',
    profileImproveButton: 'Comment pouvons-nous nous améliorer ?',
    profileImproveTitle: 'Comment pouvons-nous nous améliorer ?',
    profileImproveSubtitle: 'Envoyez vos suggestions à BarcoStop. Vos messages resteront ici et nos réponses apparaîtront dans cette même section.',
    profileImproveInputLabel: 'Votre message',
    profileImproveInputPlaceholder: 'Dites-nous ce qui devrait mieux fonctionner, ce qui vous manque ou ce qui vous a dérouté.',
    profileImproveSend: 'Envoyer à BarcoStop',
    profileImproveSending: 'Envoi...',
    profileImproveEmpty: 'Vous n’avez encore envoyé aucune suggestion.',
    profileImproveDelete: 'Supprimer',
    profileImproveDeleteTitle: 'Supprimer le message',
    profileImproveDeleteMessage: 'Voulez-vous supprimer ce message ? Cette action est irréversible.',
    profileImproveDeleted: 'Message supprimé.',
    profileImproveSent: 'Votre suggestion a été envoyée avec succès.',
    profileImproveLoadError: 'Impossible de charger vos messages d’amélioration.',
    profileImproveSendError: 'Impossible d’envoyer votre message à BarcoStop.',
    profileImproveDeleteError: 'Impossible de supprimer le message.',
    profileImproveReplyTitle: 'Réponse de BarcoStop',
    profileImproveStatusOpen: 'Ouvert',
    profileImproveStatusAnswered: 'Répondu',
    profileImproveStatusClosed: 'Fermé',
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
    tripKindTrip: 'Voyage',
    tripKindRegatta: 'Régate',
    regattaJoin: 'Rejoindre la régate',
    regattaJoined: 'Déjà inscrit à la régate',
    regattaParticipantsTitle: 'Capitaines inscrits',
    regattaParticipantsEmpty: 'Aucun capitaine inscrit pour le moment.',
    regattaOnlyCaptains: 'Les régates sont réservées aux capitaines.',
    ratePassenger: 'Comment évaluez-vous ce passager ?',
    rateComment: 'Commentaire (facultatif)',
    rateSubmit: 'Soumettre l\'évaluation',
    rateCancel: 'Annuler',
    ratingOutOf: 'sur 5',
  },
  pt: {
    homeSubtitle: 'Uma nova experiência de viagem',
    homeAnimateSailor: 'Anime marinheiro!!!!',
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
    tripListCreateRegatta: '+ Criar regata',
    tripListProfile: 'Perfil',
    tripListAvailable: 'Viagens disponíveis',
    tripListSearchExpand: 'Mais filtros',
    tripListSearchCollapse: 'Ocultar filtros',
    tripListSearchHint: 'Toque em origem para mostrar destino e data.',
    tripListSearchPortButton: 'Porto de saida',
    tripListSearchPortValueEmpty: 'Escolher origem',
    tripListSearchOriginPlaceholder: 'Origem',
    tripListSearchDestinationPlaceholder: 'Destino',
    tripListSearchDatePlaceholder: 'Data (ex: 2026-03-06)',
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
    createRegattaTitle: 'Criar nova regata',
    createTripModeTrip: 'Viagem',
    createTripModeRegatta: 'Regata',
    createTripFieldTitle: 'Título',
    createTripFieldOrigin: 'Origem',
    createTripFieldDestination: 'Destino',
    createTripFieldDate: 'Data de saída (YYYY-MM-DD HH:mm)',
    createTripFieldSeats: 'Assentos',
    createTripFieldPrice: 'Preço',
    createTripSave: 'Criar viagem',
    createRegattaSave: 'Criar regata',
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
    authPassword: 'Senha',
    authConfirmPassword: 'Confirmar senha',
    authContinue: 'Continuar',
    authProcessing: 'Processando...',
    authHaveAccount: 'Já tem conta? Faça login',
    authNoAccount: 'Não tem conta? Cadastre-se',
    authRequiredTitle: 'Campos obrigatórios',
    authRequiredMessage: 'Preencha os dados para continuar',
    authPasswordMismatchTitle: 'Confirmação de senha',
    authPasswordMismatchMessage: 'As senhas não coincidem.',
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
    profileSaveError: 'Não foi possível salvar o perfil.',
    profileAvatarOpenError: 'Não foi possível abrir a galeria.',
    profileAvatarReadError: 'Não foi possível obter a foto selecionada.',
    profileAvatarFormatError: 'Formato não compatível. Escolha uma foto JPG, PNG ou WEBP.',
    profileAvatarTooLarge: 'A foto é muito pesada (máx. 5 MB). Escolha uma imagem mais leve.',
    profileAvatarSelectError: 'Não foi possível selecionar a foto.',
    profileAvatarUploadError: 'Não foi possível enviar o avatar.',
    profileSkillsGeneral: 'Habilidades gerais (separadas por vírgula)',
    profileSkillsLanguages: 'Idiomas (separados por vírgula)',
    profileSkillsCleaning: 'Nível de limpeza',
    levelBeginner: 'Iniciante',
    levelIntermediate: 'Intermediário',
    levelExpert: 'Especialista',
    profileRating: 'Classificação',
    profileReviews: 'Avaliações',
    profilePhotoTitle: 'Foto de perfil',
    profileChooseGallery: 'Escolher da galeria',
    profileAvatarHint: 'Escolha uma foto da sua galeria.',
    profileRatingTitle: 'Pontuação',
    profileMyRating: 'Minha pontuação',
    profileCommentsCount: 'comentários',
    profileUserComments: 'Comentários dos usuários',
    profileAnonymousUser: 'Usuário anônimo',
    profileDateUnavailable: 'Data indisponível',
    profileDonationThanks: 'Obrigado por oferecer um café ou uma cerveja à equipe BarcoStop.',
    profileDonateButton: 'Doar com PayPal',
    profileDonateTitle: 'Doação PayPal',
    profileDonatePrompt: 'Obrigado pelo seu apoio à equipe BarcoStop. Doação mínima: €2.50',
    profileDonateSmall: 'Doar €2.50',
    profileDonateMedium: 'Doar €5.00',
    profileDonationConfirmTitle: 'Confirmar doação',
    profileDonationConfirmMessage: 'Você concluiu a doação de €{{amount}} no PayPal?',
    profileDonationRecorded: 'Doação de €{{amount}} registrada',
    profileDonationRecordFailed: 'Não conseguimos registrar a doação automaticamente.',
    profileImproveButton: 'Como podemos melhorar?',
    profileImproveTitle: 'Como podemos melhorar?',
    profileImproveSubtitle: 'Envie suas sugestões para o BarcoStop. Suas mensagens ficarão aqui e nossas respostas aparecerão nesta mesma seção.',
    profileImproveInputLabel: 'Sua mensagem',
    profileImproveInputPlaceholder: 'Conte-nos o que deveria funcionar melhor, o que falta ou o que causou confusão.',
    profileImproveSend: 'Enviar para BarcoStop',
    profileImproveSending: 'Enviando...',
    profileImproveEmpty: 'Você ainda não enviou nenhuma sugestão.',
    profileImproveDelete: 'Excluir',
    profileImproveDeleteTitle: 'Excluir mensagem',
    profileImproveDeleteMessage: 'Deseja excluir esta mensagem? Esta ação não pode ser desfeita.',
    profileImproveDeleted: 'Mensagem excluída.',
    profileImproveSent: 'Sua sugestão foi enviada com sucesso.',
    profileImproveLoadError: 'Não foi possível carregar suas mensagens de melhoria.',
    profileImproveSendError: 'Não foi possível enviar sua mensagem ao BarcoStop.',
    profileImproveDeleteError: 'Não foi possível excluir a mensagem.',
    profileImproveReplyTitle: 'Resposta do BarcoStop',
    profileImproveStatusOpen: 'Aberto',
    profileImproveStatusAnswered: 'Respondido',
    profileImproveStatusClosed: 'Fechado',
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
    tripKindTrip: 'Viagem',
    tripKindRegatta: 'Regata',
    regattaJoin: 'Entrar na regata',
    regattaJoined: 'Já inscrito na regata',
    regattaParticipantsTitle: 'Capitães inscritos',
    regattaParticipantsEmpty: 'Nenhum capitão entrou ainda.',
    regattaOnlyCaptains: 'As regatas são apenas para capitães.',
    ratePassenger: 'Como você avaliaria este passageiro?',
    rateComment: 'Comentário (opcional)',
    rateSubmit: 'Enviar avaliação',
    rateCancel: 'Cancelar',
    ratingOutOf: 'de 5',
  },
};
