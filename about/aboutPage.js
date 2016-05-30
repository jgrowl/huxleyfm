const Soma = require('../models/soma');
const Eventful = require('../models/eventful');

module.exports = class AboutPage extends Eventful {
  constructor() {
    console.debug('about page init');
    super();
    this.findElements();
    this.getVersionInfo();
  }

  findElements() {
    this.versionInfo = document.getElementById('version-info');
  }

  removeListeners() {
    console.debug('unbinding about page listeners');
  }

  getVersionInfo() {
    const soma = new Soma();
    soma.getScrobblerApiVersion().
         then(this.showVersionInfo.bind(this)).
         catch(this.scrobblerVersionError.bind(this));
  }

  showVersionInfo(data) {
    console.log(data);
    this.versionInfo.classList.remove('hidden');
  }

  scrobblerVersionError(error) {
    console.error('failed to fetch SomaScrobbler version', error);
    this.emit('error', 'Error accessing SomaScrobbler API.');
  }
}
