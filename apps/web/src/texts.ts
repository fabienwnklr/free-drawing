import type { Drawer, Language } from '@fabwcie/free-drawing';
import { ApiError } from './api';

const en = {
  signIn: 'Sign in',
  signUp: 'Create account',
  signOut: 'Sign out',
  toSignUp: 'No account yet? Create one',
  toSignIn: 'Already have an account? Sign in',
  accountIntro: 'Your drawings and preferences are saved with your account.',
  name: 'Name',
  email: 'Email',
  password: 'Password',
  passwordHint: '8 characters at least',
  myDrawings: 'My drawings',
  newDrawing: 'New drawing',
  untitled: 'Untitled drawing',
  drawingName: 'Drawing name',
  updated: 'Updated {date}',
  empty: 'No drawings yet',
  delete: 'Delete {name}',
  deleteConfirm: 'Delete "{name}"? It can\'t be undone.',
  close: 'Close',
  saving: 'Saving...',
  saved: 'Saved',
  notSaved: 'Not saved',
  unsaved: 'Unsaved changes',
  autoSave: 'Auto save',
  autoSaveHint: 'Save changes automatically',
  errorCredentials: 'Wrong email or password',
  errorEmailTaken: 'An account already uses this email',
  errorPassword: 'Password of 8 characters at least',
  errorEmail: 'Invalid email',
  account: 'My account',
  profile: 'Profile',
  save: 'Save',
  profileSaved: 'Profile saved',
  changePassword: 'Change password',
  currentPassword: 'Current password',
  newPassword: 'New password',
  passwordChanged: 'Password changed, other sessions signed out',
  deleteAccount: 'Delete account',
  deleteAccountWarning: "Your drawings and preferences are deleted with your account. It can't be undone.",
  deleteMyAccount: 'Delete my account',
  deleteAccountConfirm: "Delete your account and all your drawings? It can't be undone.",
  accountDeleted: 'Account deleted',
  errorCurrentPassword: 'Wrong password',
  error: 'Something went wrong: {error}',
};

type Key = keyof typeof en;

const fr: Record<Key, string> = {
  signIn: 'Se connecter',
  signUp: 'Créer un compte',
  signOut: 'Se déconnecter',
  toSignUp: 'Pas encore de compte ? En créer un',
  toSignIn: 'Déjà un compte ? Se connecter',
  accountIntro: 'Vos dessins et vos préférences sont enregistrés avec votre compte.',
  name: 'Nom',
  email: 'Email',
  password: 'Mot de passe',
  passwordHint: '8 caractères au moins',
  myDrawings: 'Mes dessins',
  newDrawing: 'Nouveau dessin',
  untitled: 'Dessin sans titre',
  drawingName: 'Nom du dessin',
  updated: 'Modifié le {date}',
  empty: 'Aucun dessin pour le moment',
  delete: 'Supprimer {name}',
  deleteConfirm: 'Supprimer « {name} » ? Cette action est définitive.',
  close: 'Fermer',
  saving: 'Enregistrement...',
  saved: 'Enregistré',
  notSaved: 'Non enregistré',
  unsaved: 'Modifications non enregistrées',
  autoSave: 'Sauvegarde auto',
  autoSaveHint: 'Enregistrer automatiquement les modifications',
  errorCredentials: 'Email ou mot de passe incorrect',
  errorEmailTaken: 'Un compte utilise déjà cet email',
  errorPassword: 'Mot de passe de 8 caractères au moins',
  errorEmail: 'Email invalide',
  account: 'Mon compte',
  profile: 'Profil',
  save: 'Enregistrer',
  profileSaved: 'Profil enregistré',
  changePassword: 'Changer le mot de passe',
  currentPassword: 'Mot de passe actuel',
  newPassword: 'Nouveau mot de passe',
  passwordChanged: 'Mot de passe modifié, autres sessions déconnectées',
  deleteAccount: 'Supprimer le compte',
  deleteAccountWarning: 'Vos dessins et vos préférences sont supprimés avec votre compte. Cette action est définitive.',
  deleteMyAccount: 'Supprimer mon compte',
  deleteAccountConfirm: 'Supprimer votre compte et tous vos dessins ? Cette action est définitive.',
  accountDeleted: 'Compte supprimé',
  errorCurrentPassword: 'Mot de passe incorrect',
  error: 'Une erreur est survenue : {error}',
};

const es: Record<Key, string> = {
  signIn: 'Iniciar sesión',
  signUp: 'Crear cuenta',
  signOut: 'Cerrar sesión',
  toSignUp: '¿Aún no tienes cuenta? Crea una',
  toSignIn: '¿Ya tienes cuenta? Inicia sesión',
  accountIntro: 'Tus dibujos y preferencias se guardan con tu cuenta.',
  name: 'Nombre',
  email: 'Correo electrónico',
  password: 'Contraseña',
  passwordHint: '8 caracteres como mínimo',
  myDrawings: 'Mis dibujos',
  newDrawing: 'Nuevo dibujo',
  untitled: 'Dibujo sin título',
  drawingName: 'Nombre del dibujo',
  updated: 'Modificado el {date}',
  empty: 'Todavía no hay dibujos',
  delete: 'Eliminar {name}',
  deleteConfirm: '¿Eliminar «{name}»? No se puede deshacer.',
  close: 'Cerrar',
  saving: 'Guardando...',
  saved: 'Guardado',
  notSaved: 'No guardado',
  unsaved: 'Cambios sin guardar',
  autoSave: 'Guardado automático',
  autoSaveHint: 'Guardar los cambios automáticamente',
  errorCredentials: 'Correo o contraseña incorrectos',
  errorEmailTaken: 'Ya existe una cuenta con este correo',
  errorPassword: 'Contraseña de 8 caracteres como mínimo',
  errorEmail: 'Correo no válido',
  account: 'Mi cuenta',
  profile: 'Perfil',
  save: 'Guardar',
  profileSaved: 'Perfil guardado',
  changePassword: 'Cambiar contraseña',
  currentPassword: 'Contraseña actual',
  newPassword: 'Nueva contraseña',
  passwordChanged: 'Contraseña cambiada, otras sesiones cerradas',
  deleteAccount: 'Eliminar la cuenta',
  deleteAccountWarning: 'Tus dibujos y preferencias se eliminan con tu cuenta. No se puede deshacer.',
  deleteMyAccount: 'Eliminar mi cuenta',
  deleteAccountConfirm: '¿Eliminar tu cuenta y todos tus dibujos? No se puede deshacer.',
  accountDeleted: 'Cuenta eliminada',
  errorCurrentPassword: 'Contraseña incorrecta',
  error: 'Se produjo un error: {error}',
};

const de: Record<Key, string> = {
  signIn: 'Anmelden',
  signUp: 'Konto erstellen',
  signOut: 'Abmelden',
  toSignUp: 'Noch kein Konto? Jetzt erstellen',
  toSignIn: 'Schon ein Konto? Anmelden',
  accountIntro: 'Ihre Zeichnungen und Einstellungen werden mit Ihrem Konto gespeichert.',
  name: 'Name',
  email: 'E-Mail',
  password: 'Passwort',
  passwordHint: 'Mindestens 8 Zeichen',
  myDrawings: 'Meine Zeichnungen',
  newDrawing: 'Neue Zeichnung',
  untitled: 'Zeichnung ohne Titel',
  drawingName: 'Name der Zeichnung',
  updated: 'Geändert am {date}',
  empty: 'Noch keine Zeichnungen',
  delete: '{name} löschen',
  deleteConfirm: '„{name}“ löschen? Das kann nicht rückgängig gemacht werden.',
  close: 'Schließen',
  saving: 'Wird gespeichert...',
  saved: 'Gespeichert',
  notSaved: 'Nicht gespeichert',
  unsaved: 'Ungespeicherte Änderungen',
  autoSave: 'Automatisch speichern',
  autoSaveHint: 'Änderungen automatisch speichern',
  errorCredentials: 'E-Mail oder Passwort falsch',
  errorEmailTaken: 'Ein Konto verwendet diese E-Mail bereits',
  errorPassword: 'Passwort mit mindestens 8 Zeichen',
  errorEmail: 'Ungültige E-Mail',
  account: 'Mein Konto',
  profile: 'Profil',
  save: 'Speichern',
  profileSaved: 'Profil gespeichert',
  changePassword: 'Passwort ändern',
  currentPassword: 'Aktuelles Passwort',
  newPassword: 'Neues Passwort',
  passwordChanged: 'Passwort geändert, andere Sitzungen abgemeldet',
  deleteAccount: 'Konto löschen',
  deleteAccountWarning:
    'Ihre Zeichnungen und Einstellungen werden mit Ihrem Konto gelöscht. Das kann nicht rückgängig gemacht werden.',
  deleteMyAccount: 'Mein Konto löschen',
  deleteAccountConfirm: 'Ihr Konto und alle Ihre Zeichnungen löschen? Das kann nicht rückgängig gemacht werden.',
  accountDeleted: 'Konto gelöscht',
  errorCurrentPassword: 'Falsches Passwort',
  error: 'Ein Fehler ist aufgetreten: {error}',
};

const texts: Record<Language, Record<Key, string>> = { en, fr, es, de };

/**
 * Texts of the app in the language of the drawer (chosen in its menu)
 */
export class Texts {
  constructor(private readonly drawer: Drawer) {}

  t = (key: Key, params: Record<string, string> = {}): string =>
    (texts[this.drawer.language] ?? en)[key].replace(/\{(\w+)\}/g, (match, name) => params[name] ?? match);

  /** Error of the server, known errors of Better Auth explained */
  error = (error: Error): string => {
    const code = error instanceof ApiError ? error.code ?? '' : '';

    if (code.includes('INVALID_EMAIL_OR_PASSWORD')) return this.t('errorCredentials');
    if (code.includes('USER_ALREADY_EXISTS')) return this.t('errorEmailTaken');
    if (code.includes('PASSWORD_TOO_SHORT')) return this.t('errorPassword');
    if (code === 'INVALID_PASSWORD') return this.t('errorCurrentPassword');
    if (code.includes('INVALID_EMAIL')) return this.t('errorEmail');
    return this.t('error', { error: error.message });
  };

  /** Date and time of an ISO date */
  date = (iso: string): string =>
    new Intl.DateTimeFormat(this.drawer.language, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
}
