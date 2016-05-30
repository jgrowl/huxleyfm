const Settings = require('../models/settings');
const Router = require('../models/router');
const LinkHandler = require('../models/linkHandler');
const IndexPage = require('../index/indexPage');
const SettingsPage = require('../settings/settingsPage');
const AboutPage = require('../about/aboutPage');
const FlashMessages = require('../models/flashMessages');
// const Client = require('castv2-client').Client;
// const DefaultMediaReceiver = require('castv2-client').DefaultMediaReceiver;
// const mdns = require('mdns');
const AppMenu = require('../models/appMenu');

const __bind = function(fn, me) {
  return function() {
    return fn.apply(me, arguments);
  };
};

class PageLoader {
  constructor() {
    console.debug('page loader init');
    this.pageID = null;
    this.page = null;
    this.station = null;
    this.onPageLoad = __bind(this.onPageLoad, this);
    this.findElements();
    this.flashMessages = new FlashMessages(this.statusArea);
    Settings.load().then(this.onInitialSettingsLoad.bind(this));
    this.listenForCast();
    this.setupAppMenu();
  }

  findElements() {
    this.statusArea = document.getElementById('status-message');
    this.audioTag = document.querySelector('audio');
    this.chromecastWrapper = document.getElementById('chromecast-wrapper');
    this.chromecastLink = this.chromecastWrapper.querySelector('a');
    this.chromecastIcon = this.chromecastLink.querySelector('.material-icons');
    this.returnLinkWrapper = document.getElementById('return-link-wrapper');
    this.settingsLinkWrapper = document.getElementById('settings-wrapper');
  }

  onInitialSettingsLoad(settings) {
    this.settings = settings;
    this.setupRouter();
  }

  listenForCast() {
    this.chromecastLink.addEventListener('click', this.onChromecast.bind(this));
  }

  setupAppMenu() {
    const menu = new AppMenu();
    menu.addListener('about-app', () => {
      this.router.loadPage('about/about.html', 'about');
    });
    menu.addListener('preferences', () => {
      this.router.loadPage('settings/settings.html', 'settings');
    });
  }

  setupRouter() {
    this.router = new Router();
    this.router.addListener('page:loaded', (id, d) => this.onPageLoaded(id, d));
    this.router.loadPage('index/index.html', 'player');
  }

  onPageLoaded(pageID, data) {
    if (this.page && pageID !== this.pageID) {
      this.page.removeListeners();
    }
    this.updatePageClass(pageID);
    document.getElementById('page-container').innerHTML = data;
    this.handleLinks();
    this.applyTheme(this.settings.theme);
    this.initPage(pageID);
  }

  initPage(pageID) {
    if (pageID === 'player') {
      this.onIndexPageLoaded();
    } else if (pageID === 'settings') {
      this.onSettingsPageLoaded();
    } else if (pageID === 'about') {
      this.onAboutPageLoaded();
    }
  }

  handleLinks() {
    if (this.linkHandler) {
      this.linkHandler.removeListener('page:load', this.onPageLoad);
    }
    this.linkHandler = new LinkHandler();
    this.linkHandler.addListener('page:load', this.onPageLoad);
  }

  onPageLoad(p, id) {
    this.router.loadPage(p, id);
  }

  updatePageClass(pageID) {
    if (this.pageID) {
      document.body.classList.remove(this.pageID);
    }
    this.pageID = pageID;
    document.body.classList.add(pageID);
  }

  applyTheme(theme) {
    document.body.classList.remove('theme-light');
    document.body.classList.remove('theme-dark');
    document.body.classList.add('theme-' + (theme || 'light'));
  }

  onIndexPageLoaded() {
    if (this.page && this.page instanceof IndexPage) {
      return;
    }
    this.page = new IndexPage(this.settings, this.audioTag);
    this.listenForPageMessages();
    this.page.addListener('play', this.onPlay.bind(this));
    this.page.addListener('pause', this.onPause.bind(this));
    this.returnLinkWrapper.classList.add('hidden');
    this.settingsLinkWrapper.classList.remove('hidden');
  }

  onSettingsPageLoaded() {
    if (this.page && this.page instanceof SettingsPage) {
      return;
    }
    this.page = new SettingsPage(this.settings);
    this.listenForPageMessages();
    this.returnLinkWrapper.classList.remove('hidden');
    this.settingsLinkWrapper.classList.add('hidden');
  }

  onAboutPageLoaded() {
    if (this.page && this.page instanceof AboutPage) {
      return;
    }
    this.page = new AboutPage();
    this.listenForPageMessages();
    this.returnLinkWrapper.classList.remove('hidden');
    this.settingsLinkWrapper.classList.add('hidden');
  }

  listenForPageMessages() {
    this.page.addListener('settings:change', (s) => this.onSettingsChanged(s));
    this.page.addListener('error', (e) => this.flashMessages.error(e));
    this.page.addListener('notice', (m) => this.flashMessages.notice(m));
  }

  onPlay(station, url) {
    this.station = station;
    if (process.env.ENABLE_CHROMECAST) {
      this.chromecastWrapper.classList.remove('hidden');
    }
  }

  onPause(station) {
    this.station = null;
    if (process.env.ENABLE_CHROMECAST) {
      this.chromecastWrapper.classList.add('hidden');
    }
  }

  onChromecast() {
    if (!process.env.ENABLE_CHROMECAST) {
      return;
    }
    console.log('onChromecast');
  }

  onSettingsChanged(settings) {
    this.settings = settings;
    this.applyTheme(settings.theme);
  }
}

document.addEventListener('DOMContentLoaded', function() {
  new PageLoader();
});
