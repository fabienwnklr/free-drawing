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
  sessionLeft: 'Live collaboration stopped: another drawing is open',
  newDrawing: 'New drawing',
  untitled: 'Untitled drawing',
  drawingName: 'Drawing name',
  updated: 'Updated {date}',
  empty: 'No drawings yet',
  localDrawings: 'Kept in this browser',
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
  errorTooManyDrawings: 'Too many drawings: delete some to create a new one',
  errorDrawingsTooBig: 'Drawings of your account are too big: delete some to save this one',
  error: 'Something went wrong: {error}',
  sessionEnded: 'Your session ended: sign in again to save this drawing',
  keptInBrowser: 'Changes not saved in your account: kept in a drawing of this browser',
  errorTooManyRequests: 'Too many attempts: wait a moment and try again',
  errorNotFound: 'Not found: it may have been deleted',
  errorPasswordTooLong: 'Password too long',
  errorTooBig: 'Too big to be saved',
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
  sessionLeft: 'Collaboration en direct arrêtée : un autre dessin est ouvert',
  newDrawing: 'Nouveau dessin',
  untitled: 'Dessin sans titre',
  drawingName: 'Nom du dessin',
  updated: 'Modifié le {date}',
  empty: 'Aucun dessin pour le moment',
  localDrawings: 'Gardés dans ce navigateur',
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
  errorTooManyDrawings: 'Trop de dessins : supprimez-en pour en créer un nouveau',
  errorDrawingsTooBig: 'Les dessins de votre compte sont trop volumineux : supprimez-en pour enregistrer celui-ci',
  error: 'Une erreur est survenue : {error}',
  sessionEnded: 'Votre session est terminée : reconnectez-vous pour enregistrer ce dessin',
  keptInBrowser: 'Modifications non enregistrées dans votre compte : gardées dans un dessin de ce navigateur',
  errorTooManyRequests: 'Trop de tentatives : patientez un moment et réessayez',
  errorNotFound: 'Introuvable : il a peut-être été supprimé',
  errorPasswordTooLong: 'Mot de passe trop long',
  errorTooBig: 'Trop volumineux pour être enregistré',
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
  sessionLeft: 'Colaboración en directo detenida: se abrió otro dibujo',
  newDrawing: 'Nuevo dibujo',
  untitled: 'Dibujo sin título',
  drawingName: 'Nombre del dibujo',
  updated: 'Modificado el {date}',
  empty: 'Todavía no hay dibujos',
  localDrawings: 'Guardados en este navegador',
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
  errorTooManyDrawings: 'Demasiados dibujos: elimina algunos para crear uno nuevo',
  errorDrawingsTooBig: 'Los dibujos de tu cuenta son demasiado grandes: elimina algunos para guardar este',
  error: 'Se produjo un error: {error}',
  sessionEnded: 'Tu sesión ha terminado: vuelve a iniciar sesión para guardar este dibujo',
  keptInBrowser: 'Cambios no guardados en tu cuenta: conservados en un dibujo de este navegador',
  errorTooManyRequests: 'Demasiados intentos: espera un momento y vuelve a intentarlo',
  errorNotFound: 'No encontrado: puede que se haya eliminado',
  errorPasswordTooLong: 'Contraseña demasiado larga',
  errorTooBig: 'Demasiado grande para guardarse',
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
  sessionLeft: 'Live-Zusammenarbeit beendet: eine andere Zeichnung ist geöffnet',
  newDrawing: 'Neue Zeichnung',
  untitled: 'Zeichnung ohne Titel',
  drawingName: 'Name der Zeichnung',
  updated: 'Geändert am {date}',
  empty: 'Noch keine Zeichnungen',
  localDrawings: 'In diesem Browser gespeichert',
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
  errorTooManyDrawings: 'Zu viele Zeichnungen: löschen Sie einige, um eine neue zu erstellen',
  errorDrawingsTooBig: 'Die Zeichnungen Ihres Kontos sind zu groß: löschen Sie einige, um diese zu speichern',
  error: 'Ein Fehler ist aufgetreten: {error}',
  sessionEnded: 'Ihre Sitzung ist abgelaufen: melden Sie sich erneut an, um diese Zeichnung zu speichern',
  keptInBrowser: 'Änderungen nicht in Ihrem Konto gespeichert: in einer Zeichnung dieses Browsers behalten',
  errorTooManyRequests: 'Zu viele Versuche: warten Sie einen Moment und versuchen Sie es erneut',
  errorNotFound: 'Nicht gefunden: möglicherweise wurde es gelöscht',
  errorPasswordTooLong: 'Passwort zu lang',
  errorTooBig: 'Zu groß zum Speichern',
};

const texts: Record<Language, Record<Key, string>> = { en, fr, es, de };

/**
 * Texts of the app in the language of the drawer (chosen in its menu)
 */
export class Texts {
  constructor(private readonly drawer: Drawer) {}

  t = (key: Key, params: Record<string, string> = {}): string =>
    (texts[this.drawer.language] ?? en)[key].replace(/\{(\w+)\}/g, (match, name) => params[name] ?? match);

  /** Known error of the server (Better Auth, limits of drawings, statuses) explained, null for others */
  private _known(error: Error): string | null {
    const code = error instanceof ApiError ? error.code ?? '' : '';
    const status = error instanceof ApiError ? error.status : 0;

    if (code.includes('INVALID_EMAIL_OR_PASSWORD')) return this.t('errorCredentials');
    if (code.includes('USER_ALREADY_EXISTS')) return this.t('errorEmailTaken');
    if (code.includes('PASSWORD_TOO_SHORT')) return this.t('errorPassword');
    if (code.includes('PASSWORD_TOO_LONG')) return this.t('errorPasswordTooLong');
    if (code === 'INVALID_PASSWORD') return this.t('errorCurrentPassword');
    if (code.includes('INVALID_EMAIL')) return this.t('errorEmail');
    if (code === 'TOO_MANY_DRAWINGS') return this.t('errorTooManyDrawings');
    if (code === 'DRAWINGS_TOO_BIG') return this.t('errorDrawingsTooBig');
    // session ended (signed out elsewhere, password changed, expired), drawing deleted, body too big, rate limits
    if (status === 401) return this.t('sessionEnded');
    if (status === 404) return this.t('errorNotFound');
    if (status === 413) return this.t('errorTooBig');
    if (status === 429) return this.t('errorTooManyRequests');
    return null;
  }

  /** Error of the server, known errors explained */
  error = (error: Error): string => this._known(error) ?? this.t('error', { error: error.message });

  /** Reason of an error of the server: known errors explained, else its message */
  reason = (error: Error): string => this._known(error) ?? error.message;

  /** Date and time of an ISO date */
  date = (iso: string): string =>
    new Intl.DateTimeFormat(this.drawer.language, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
}
