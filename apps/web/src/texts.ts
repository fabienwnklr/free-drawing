import type { Drawer, Language } from '@fabwcie/free-drawing';

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
  errorCredentials: 'Wrong email or password',
  errorEmailTaken: 'An account already uses this email',
  errorPassword: 'Password of 8 characters at least',
  errorEmail: 'Invalid email',
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
  errorCredentials: 'Email ou mot de passe incorrect',
  errorEmailTaken: 'Un compte utilise déjà cet email',
  errorPassword: 'Mot de passe de 8 caractères au moins',
  errorEmail: 'Email invalide',
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
  errorCredentials: 'Correo o contraseña incorrectos',
  errorEmailTaken: 'Ya existe una cuenta con este correo',
  errorPassword: 'Contraseña de 8 caracteres como mínimo',
  errorEmail: 'Correo no válido',
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
  errorCredentials: 'E-Mail oder Passwort falsch',
  errorEmailTaken: 'Ein Konto verwendet diese E-Mail bereits',
  errorPassword: 'Passwort mit mindestens 8 Zeichen',
  errorEmail: 'Ungültige E-Mail',
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

  /** Date and time of an ISO date */
  date = (iso: string): string =>
    new Intl.DateTimeFormat(this.drawer.language, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
}
