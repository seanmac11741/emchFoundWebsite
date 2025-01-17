// node_modules/@firebase/util/dist/index.esm2017.js
var getGlobal = function() {
  if (typeof self !== "undefined") {
    return self;
  }
  if (typeof window !== "undefined") {
    return window;
  }
  if (typeof global !== "undefined") {
    return global;
  }
  throw new Error("Unable to locate global object.");
};
var isBrowserExtension = function() {
  const runtime = typeof chrome === "object" ? chrome.runtime : typeof browser === "object" ? browser.runtime : undefined;
  return typeof runtime === "object" && runtime.id !== undefined;
};
var isIndexedDBAvailable = function() {
  try {
    return typeof indexedDB === "object";
  } catch (e) {
    return false;
  }
};
var validateIndexedDBOpenable = function() {
  return new Promise((resolve, reject) => {
    try {
      let preExist = true;
      const DB_CHECK_NAME = "validate-browser-context-for-indexeddb-analytics-module";
      const request = self.indexedDB.open(DB_CHECK_NAME);
      request.onsuccess = () => {
        request.result.close();
        if (!preExist) {
          self.indexedDB.deleteDatabase(DB_CHECK_NAME);
        }
        resolve(true);
      };
      request.onupgradeneeded = () => {
        preExist = false;
      };
      request.onerror = () => {
        var _a;
        reject(((_a = request.error) === null || _a === undefined ? undefined : _a.message) || "");
      };
    } catch (error) {
      reject(error);
    }
  });
};
var areCookiesEnabled = function() {
  if (typeof navigator === "undefined" || !navigator.cookieEnabled) {
    return false;
  }
  return true;
};
var replaceTemplate = function(template, data) {
  return template.replace(PATTERN, (_, key) => {
    const value = data[key];
    return value != null ? String(value) : `<${key}?>`;
  });
};
var deepEqual = function(a, b) {
  if (a === b) {
    return true;
  }
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  for (const k of aKeys) {
    if (!bKeys.includes(k)) {
      return false;
    }
    const aProp = a[k];
    const bProp = b[k];
    if (isObject(aProp) && isObject(bProp)) {
      if (!deepEqual(aProp, bProp)) {
        return false;
      }
    } else if (aProp !== bProp) {
      return false;
    }
  }
  for (const k of bKeys) {
    if (!aKeys.includes(k)) {
      return false;
    }
  }
  return true;
};
var isObject = function(thing) {
  return thing !== null && typeof thing === "object";
};
var calculateBackoffMillis = function(backoffCount, intervalMillis = DEFAULT_INTERVAL_MILLIS, backoffFactor = DEFAULT_BACKOFF_FACTOR) {
  const currBaseValue = intervalMillis * Math.pow(backoffFactor, backoffCount);
  const randomWait = Math.round(RANDOM_FACTOR * currBaseValue * (Math.random() - 0.5) * 2);
  return Math.min(MAX_VALUE_MILLIS, currBaseValue + randomWait);
};
var getModularInstance = function(service) {
  if (service && service._delegate) {
    return service._delegate;
  } else {
    return service;
  }
};
var stringToByteArray$1 = function(str) {
  const out = [];
  let p = 0;
  for (let i = 0;i < str.length; i++) {
    let c = str.charCodeAt(i);
    if (c < 128) {
      out[p++] = c;
    } else if (c < 2048) {
      out[p++] = c >> 6 | 192;
      out[p++] = c & 63 | 128;
    } else if ((c & 64512) === 55296 && i + 1 < str.length && (str.charCodeAt(i + 1) & 64512) === 56320) {
      c = 65536 + ((c & 1023) << 10) + (str.charCodeAt(++i) & 1023);
      out[p++] = c >> 18 | 240;
      out[p++] = c >> 12 & 63 | 128;
      out[p++] = c >> 6 & 63 | 128;
      out[p++] = c & 63 | 128;
    } else {
      out[p++] = c >> 12 | 224;
      out[p++] = c >> 6 & 63 | 128;
      out[p++] = c & 63 | 128;
    }
  }
  return out;
};
var byteArrayToString = function(bytes) {
  const out = [];
  let pos = 0, c = 0;
  while (pos < bytes.length) {
    const c1 = bytes[pos++];
    if (c1 < 128) {
      out[c++] = String.fromCharCode(c1);
    } else if (c1 > 191 && c1 < 224) {
      const c2 = bytes[pos++];
      out[c++] = String.fromCharCode((c1 & 31) << 6 | c2 & 63);
    } else if (c1 > 239 && c1 < 365) {
      const c2 = bytes[pos++];
      const c3 = bytes[pos++];
      const c4 = bytes[pos++];
      const u = ((c1 & 7) << 18 | (c2 & 63) << 12 | (c3 & 63) << 6 | c4 & 63) - 65536;
      out[c++] = String.fromCharCode(55296 + (u >> 10));
      out[c++] = String.fromCharCode(56320 + (u & 1023));
    } else {
      const c2 = bytes[pos++];
      const c3 = bytes[pos++];
      out[c++] = String.fromCharCode((c1 & 15) << 12 | (c2 & 63) << 6 | c3 & 63);
    }
  }
  return out.join("");
};
var base64 = {
  byteToCharMap_: null,
  charToByteMap_: null,
  byteToCharMapWebSafe_: null,
  charToByteMapWebSafe_: null,
  ENCODED_VALS_BASE: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
  get ENCODED_VALS() {
    return this.ENCODED_VALS_BASE + "+/=";
  },
  get ENCODED_VALS_WEBSAFE() {
    return this.ENCODED_VALS_BASE + "-_.";
  },
  HAS_NATIVE_SUPPORT: typeof atob === "function",
  encodeByteArray(input, webSafe) {
    if (!Array.isArray(input)) {
      throw Error("encodeByteArray takes an array as a parameter");
    }
    this.init_();
    const byteToCharMap = webSafe ? this.byteToCharMapWebSafe_ : this.byteToCharMap_;
    const output = [];
    for (let i = 0;i < input.length; i += 3) {
      const byte1 = input[i];
      const haveByte2 = i + 1 < input.length;
      const byte2 = haveByte2 ? input[i + 1] : 0;
      const haveByte3 = i + 2 < input.length;
      const byte3 = haveByte3 ? input[i + 2] : 0;
      const outByte1 = byte1 >> 2;
      const outByte2 = (byte1 & 3) << 4 | byte2 >> 4;
      let outByte3 = (byte2 & 15) << 2 | byte3 >> 6;
      let outByte4 = byte3 & 63;
      if (!haveByte3) {
        outByte4 = 64;
        if (!haveByte2) {
          outByte3 = 64;
        }
      }
      output.push(byteToCharMap[outByte1], byteToCharMap[outByte2], byteToCharMap[outByte3], byteToCharMap[outByte4]);
    }
    return output.join("");
  },
  encodeString(input, webSafe) {
    if (this.HAS_NATIVE_SUPPORT && !webSafe) {
      return btoa(input);
    }
    return this.encodeByteArray(stringToByteArray$1(input), webSafe);
  },
  decodeString(input, webSafe) {
    if (this.HAS_NATIVE_SUPPORT && !webSafe) {
      return atob(input);
    }
    return byteArrayToString(this.decodeStringToByteArray(input, webSafe));
  },
  decodeStringToByteArray(input, webSafe) {
    this.init_();
    const charToByteMap = webSafe ? this.charToByteMapWebSafe_ : this.charToByteMap_;
    const output = [];
    for (let i = 0;i < input.length; ) {
      const byte1 = charToByteMap[input.charAt(i++)];
      const haveByte2 = i < input.length;
      const byte2 = haveByte2 ? charToByteMap[input.charAt(i)] : 0;
      ++i;
      const haveByte3 = i < input.length;
      const byte3 = haveByte3 ? charToByteMap[input.charAt(i)] : 64;
      ++i;
      const haveByte4 = i < input.length;
      const byte4 = haveByte4 ? charToByteMap[input.charAt(i)] : 64;
      ++i;
      if (byte1 == null || byte2 == null || byte3 == null || byte4 == null) {
        throw new DecodeBase64StringError;
      }
      const outByte1 = byte1 << 2 | byte2 >> 4;
      output.push(outByte1);
      if (byte3 !== 64) {
        const outByte2 = byte2 << 4 & 240 | byte3 >> 2;
        output.push(outByte2);
        if (byte4 !== 64) {
          const outByte3 = byte3 << 6 & 192 | byte4;
          output.push(outByte3);
        }
      }
    }
    return output;
  },
  init_() {
    if (!this.byteToCharMap_) {
      this.byteToCharMap_ = {};
      this.charToByteMap_ = {};
      this.byteToCharMapWebSafe_ = {};
      this.charToByteMapWebSafe_ = {};
      for (let i = 0;i < this.ENCODED_VALS.length; i++) {
        this.byteToCharMap_[i] = this.ENCODED_VALS.charAt(i);
        this.charToByteMap_[this.byteToCharMap_[i]] = i;
        this.byteToCharMapWebSafe_[i] = this.ENCODED_VALS_WEBSAFE.charAt(i);
        this.charToByteMapWebSafe_[this.byteToCharMapWebSafe_[i]] = i;
        if (i >= this.ENCODED_VALS_BASE.length) {
          this.charToByteMap_[this.ENCODED_VALS_WEBSAFE.charAt(i)] = i;
          this.charToByteMapWebSafe_[this.ENCODED_VALS.charAt(i)] = i;
        }
      }
    }
  }
};

class DecodeBase64StringError extends Error {
  constructor() {
    super(...arguments);
    this.name = "DecodeBase64StringError";
  }
}
var base64Encode = function(str) {
  const utf8Bytes = stringToByteArray$1(str);
  return base64.encodeByteArray(utf8Bytes, true);
};
var base64urlEncodeWithoutPadding = function(str) {
  return base64Encode(str).replace(/\./g, "");
};
var base64Decode = function(str) {
  try {
    return base64.decodeString(str, true);
  } catch (e) {
    console.error("base64Decode failed: ", e);
  }
  return null;
};
var getDefaultsFromGlobal = () => getGlobal().__FIREBASE_DEFAULTS__;
var getDefaultsFromEnvVariable = () => {
  if (typeof process === "undefined" || typeof process.env === "undefined") {
    return;
  }
  const defaultsJsonString = process.env.__FIREBASE_DEFAULTS__;
  if (defaultsJsonString) {
    return JSON.parse(defaultsJsonString);
  }
};
var getDefaultsFromCookie = () => {
  if (typeof document === "undefined") {
    return;
  }
  let match;
  try {
    match = document.cookie.match(/__FIREBASE_DEFAULTS__=([^;]+)/);
  } catch (e) {
    return;
  }
  const decoded = match && base64Decode(match[1]);
  return decoded && JSON.parse(decoded);
};
var getDefaults = () => {
  try {
    return getDefaultsFromGlobal() || getDefaultsFromEnvVariable() || getDefaultsFromCookie();
  } catch (e) {
    console.info(`Unable to get __FIREBASE_DEFAULTS__ due to: ${e}`);
    return;
  }
};
var getDefaultAppConfig = () => {
  var _a;
  return (_a = getDefaults()) === null || _a === undefined ? undefined : _a.config;
};
class Deferred {
  constructor() {
    this.reject = () => {
    };
    this.resolve = () => {
    };
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }
  wrapCallback(callback) {
    return (error, value) => {
      if (error) {
        this.reject(error);
      } else {
        this.resolve(value);
      }
      if (typeof callback === "function") {
        this.promise.catch(() => {
        });
        if (callback.length === 1) {
          callback(error);
        } else {
          callback(error, value);
        }
      }
    };
  }
}
var ERROR_NAME = "FirebaseError";

class FirebaseError extends Error {
  constructor(code, message, customData) {
    super(message);
    this.code = code;
    this.customData = customData;
    this.name = ERROR_NAME;
    Object.setPrototypeOf(this, FirebaseError.prototype);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ErrorFactory.prototype.create);
    }
  }
}

class ErrorFactory {
  constructor(service, serviceName, errors) {
    this.service = service;
    this.serviceName = serviceName;
    this.errors = errors;
  }
  create(code, ...data) {
    const customData = data[0] || {};
    const fullCode = `${this.service}/${code}`;
    const template = this.errors[code];
    const message = template ? replaceTemplate(template, customData) : "Error";
    const fullMessage = `${this.serviceName}: ${message} (${fullCode}).`;
    const error = new FirebaseError(fullCode, fullMessage, customData);
    return error;
  }
}
var PATTERN = /\{\$([^}]+)}/g;
var DEFAULT_INTERVAL_MILLIS = 1000;
var DEFAULT_BACKOFF_FACTOR = 2;
var MAX_VALUE_MILLIS = 4 * 60 * 60 * 1000;
var RANDOM_FACTOR = 0.5;

// node_modules/@firebase/component/dist/esm/index.esm2017.js
var normalizeIdentifierForFactory = function(identifier) {
  return identifier === DEFAULT_ENTRY_NAME ? undefined : identifier;
};
var isComponentEager = function(component) {
  return component.instantiationMode === "EAGER";
};

class Component {
  constructor(name, instanceFactory, type) {
    this.name = name;
    this.instanceFactory = instanceFactory;
    this.type = type;
    this.multipleInstances = false;
    this.serviceProps = {};
    this.instantiationMode = "LAZY";
    this.onInstanceCreated = null;
  }
  setInstantiationMode(mode) {
    this.instantiationMode = mode;
    return this;
  }
  setMultipleInstances(multipleInstances) {
    this.multipleInstances = multipleInstances;
    return this;
  }
  setServiceProps(props) {
    this.serviceProps = props;
    return this;
  }
  setInstanceCreatedCallback(callback) {
    this.onInstanceCreated = callback;
    return this;
  }
}
var DEFAULT_ENTRY_NAME = "[DEFAULT]";

class Provider {
  constructor(name, container) {
    this.name = name;
    this.container = container;
    this.component = null;
    this.instances = new Map;
    this.instancesDeferred = new Map;
    this.instancesOptions = new Map;
    this.onInitCallbacks = new Map;
  }
  get(identifier) {
    const normalizedIdentifier = this.normalizeInstanceIdentifier(identifier);
    if (!this.instancesDeferred.has(normalizedIdentifier)) {
      const deferred = new Deferred;
      this.instancesDeferred.set(normalizedIdentifier, deferred);
      if (this.isInitialized(normalizedIdentifier) || this.shouldAutoInitialize()) {
        try {
          const instance = this.getOrInitializeService({
            instanceIdentifier: normalizedIdentifier
          });
          if (instance) {
            deferred.resolve(instance);
          }
        } catch (e) {
        }
      }
    }
    return this.instancesDeferred.get(normalizedIdentifier).promise;
  }
  getImmediate(options) {
    var _a;
    const normalizedIdentifier = this.normalizeInstanceIdentifier(options === null || options === undefined ? undefined : options.identifier);
    const optional = (_a = options === null || options === undefined ? undefined : options.optional) !== null && _a !== undefined ? _a : false;
    if (this.isInitialized(normalizedIdentifier) || this.shouldAutoInitialize()) {
      try {
        return this.getOrInitializeService({
          instanceIdentifier: normalizedIdentifier
        });
      } catch (e) {
        if (optional) {
          return null;
        } else {
          throw e;
        }
      }
    } else {
      if (optional) {
        return null;
      } else {
        throw Error(`Service ${this.name} is not available`);
      }
    }
  }
  getComponent() {
    return this.component;
  }
  setComponent(component) {
    if (component.name !== this.name) {
      throw Error(`Mismatching Component ${component.name} for Provider ${this.name}.`);
    }
    if (this.component) {
      throw Error(`Component for ${this.name} has already been provided`);
    }
    this.component = component;
    if (!this.shouldAutoInitialize()) {
      return;
    }
    if (isComponentEager(component)) {
      try {
        this.getOrInitializeService({ instanceIdentifier: DEFAULT_ENTRY_NAME });
      } catch (e) {
      }
    }
    for (const [instanceIdentifier, instanceDeferred] of this.instancesDeferred.entries()) {
      const normalizedIdentifier = this.normalizeInstanceIdentifier(instanceIdentifier);
      try {
        const instance = this.getOrInitializeService({
          instanceIdentifier: normalizedIdentifier
        });
        instanceDeferred.resolve(instance);
      } catch (e) {
      }
    }
  }
  clearInstance(identifier = DEFAULT_ENTRY_NAME) {
    this.instancesDeferred.delete(identifier);
    this.instancesOptions.delete(identifier);
    this.instances.delete(identifier);
  }
  async delete() {
    const services = Array.from(this.instances.values());
    await Promise.all([
      ...services.filter((service) => ("INTERNAL" in service)).map((service) => service.INTERNAL.delete()),
      ...services.filter((service) => ("_delete" in service)).map((service) => service._delete())
    ]);
  }
  isComponentSet() {
    return this.component != null;
  }
  isInitialized(identifier = DEFAULT_ENTRY_NAME) {
    return this.instances.has(identifier);
  }
  getOptions(identifier = DEFAULT_ENTRY_NAME) {
    return this.instancesOptions.get(identifier) || {};
  }
  initialize(opts = {}) {
    const { options = {} } = opts;
    const normalizedIdentifier = this.normalizeInstanceIdentifier(opts.instanceIdentifier);
    if (this.isInitialized(normalizedIdentifier)) {
      throw Error(`${this.name}(${normalizedIdentifier}) has already been initialized`);
    }
    if (!this.isComponentSet()) {
      throw Error(`Component ${this.name} has not been registered yet`);
    }
    const instance = this.getOrInitializeService({
      instanceIdentifier: normalizedIdentifier,
      options
    });
    for (const [instanceIdentifier, instanceDeferred] of this.instancesDeferred.entries()) {
      const normalizedDeferredIdentifier = this.normalizeInstanceIdentifier(instanceIdentifier);
      if (normalizedIdentifier === normalizedDeferredIdentifier) {
        instanceDeferred.resolve(instance);
      }
    }
    return instance;
  }
  onInit(callback, identifier) {
    var _a;
    const normalizedIdentifier = this.normalizeInstanceIdentifier(identifier);
    const existingCallbacks = (_a = this.onInitCallbacks.get(normalizedIdentifier)) !== null && _a !== undefined ? _a : new Set;
    existingCallbacks.add(callback);
    this.onInitCallbacks.set(normalizedIdentifier, existingCallbacks);
    const existingInstance = this.instances.get(normalizedIdentifier);
    if (existingInstance) {
      callback(existingInstance, normalizedIdentifier);
    }
    return () => {
      existingCallbacks.delete(callback);
    };
  }
  invokeOnInitCallbacks(instance, identifier) {
    const callbacks = this.onInitCallbacks.get(identifier);
    if (!callbacks) {
      return;
    }
    for (const callback of callbacks) {
      try {
        callback(instance, identifier);
      } catch (_a) {
      }
    }
  }
  getOrInitializeService({ instanceIdentifier, options = {} }) {
    let instance = this.instances.get(instanceIdentifier);
    if (!instance && this.component) {
      instance = this.component.instanceFactory(this.container, {
        instanceIdentifier: normalizeIdentifierForFactory(instanceIdentifier),
        options
      });
      this.instances.set(instanceIdentifier, instance);
      this.instancesOptions.set(instanceIdentifier, options);
      this.invokeOnInitCallbacks(instance, instanceIdentifier);
      if (this.component.onInstanceCreated) {
        try {
          this.component.onInstanceCreated(this.container, instanceIdentifier, instance);
        } catch (_a) {
        }
      }
    }
    return instance || null;
  }
  normalizeInstanceIdentifier(identifier = DEFAULT_ENTRY_NAME) {
    if (this.component) {
      return this.component.multipleInstances ? identifier : DEFAULT_ENTRY_NAME;
    } else {
      return identifier;
    }
  }
  shouldAutoInitialize() {
    return !!this.component && this.component.instantiationMode !== "EXPLICIT";
  }
}

class ComponentContainer {
  constructor(name) {
    this.name = name;
    this.providers = new Map;
  }
  addComponent(component) {
    const provider = this.getProvider(component.name);
    if (provider.isComponentSet()) {
      throw new Error(`Component ${component.name} has already been registered with ${this.name}`);
    }
    provider.setComponent(component);
  }
  addOrOverwriteComponent(component) {
    const provider = this.getProvider(component.name);
    if (provider.isComponentSet()) {
      this.providers.delete(component.name);
    }
    this.addComponent(component);
  }
  getProvider(name) {
    if (this.providers.has(name)) {
      return this.providers.get(name);
    }
    const provider = new Provider(name, this);
    this.providers.set(name, provider);
    return provider;
  }
  getProviders() {
    return Array.from(this.providers.values());
  }
}

// node_modules/@firebase/logger/dist/esm/index.esm2017.js
var instances = [];
var LogLevel;
(function(LogLevel2) {
  LogLevel2[LogLevel2["DEBUG"] = 0] = "DEBUG";
  LogLevel2[LogLevel2["VERBOSE"] = 1] = "VERBOSE";
  LogLevel2[LogLevel2["INFO"] = 2] = "INFO";
  LogLevel2[LogLevel2["WARN"] = 3] = "WARN";
  LogLevel2[LogLevel2["ERROR"] = 4] = "ERROR";
  LogLevel2[LogLevel2["SILENT"] = 5] = "SILENT";
})(LogLevel || (LogLevel = {}));
var levelStringToEnum = {
  debug: LogLevel.DEBUG,
  verbose: LogLevel.VERBOSE,
  info: LogLevel.INFO,
  warn: LogLevel.WARN,
  error: LogLevel.ERROR,
  silent: LogLevel.SILENT
};
var defaultLogLevel = LogLevel.INFO;
var ConsoleMethod = {
  [LogLevel.DEBUG]: "log",
  [LogLevel.VERBOSE]: "log",
  [LogLevel.INFO]: "info",
  [LogLevel.WARN]: "warn",
  [LogLevel.ERROR]: "error"
};
var defaultLogHandler = (instance, logType, ...args) => {
  if (logType < instance.logLevel) {
    return;
  }
  const now = new Date().toISOString();
  const method = ConsoleMethod[logType];
  if (method) {
    console[method](`[${now}]  ${instance.name}:`, ...args);
  } else {
    throw new Error(`Attempted to log a message with an invalid logType (value: ${logType})`);
  }
};

class Logger {
  constructor(name) {
    this.name = name;
    this._logLevel = defaultLogLevel;
    this._logHandler = defaultLogHandler;
    this._userLogHandler = null;
    instances.push(this);
  }
  get logLevel() {
    return this._logLevel;
  }
  set logLevel(val) {
    if (!(val in LogLevel)) {
      throw new TypeError(`Invalid value "${val}" assigned to \`logLevel\``);
    }
    this._logLevel = val;
  }
  setLogLevel(val) {
    this._logLevel = typeof val === "string" ? levelStringToEnum[val] : val;
  }
  get logHandler() {
    return this._logHandler;
  }
  set logHandler(val) {
    if (typeof val !== "function") {
      throw new TypeError("Value assigned to `logHandler` must be a function");
    }
    this._logHandler = val;
  }
  get userLogHandler() {
    return this._userLogHandler;
  }
  set userLogHandler(val) {
    this._userLogHandler = val;
  }
  debug(...args) {
    this._userLogHandler && this._userLogHandler(this, LogLevel.DEBUG, ...args);
    this._logHandler(this, LogLevel.DEBUG, ...args);
  }
  log(...args) {
    this._userLogHandler && this._userLogHandler(this, LogLevel.VERBOSE, ...args);
    this._logHandler(this, LogLevel.VERBOSE, ...args);
  }
  info(...args) {
    this._userLogHandler && this._userLogHandler(this, LogLevel.INFO, ...args);
    this._logHandler(this, LogLevel.INFO, ...args);
  }
  warn(...args) {
    this._userLogHandler && this._userLogHandler(this, LogLevel.WARN, ...args);
    this._logHandler(this, LogLevel.WARN, ...args);
  }
  error(...args) {
    this._userLogHandler && this._userLogHandler(this, LogLevel.ERROR, ...args);
    this._logHandler(this, LogLevel.ERROR, ...args);
  }
}
// node_modules/idb/build/wrap-idb-value.js
var getIdbProxyableTypes = function() {
  return idbProxyableTypes || (idbProxyableTypes = [
    IDBDatabase,
    IDBObjectStore,
    IDBIndex,
    IDBCursor,
    IDBTransaction
  ]);
};
var getCursorAdvanceMethods = function() {
  return cursorAdvanceMethods || (cursorAdvanceMethods = [
    IDBCursor.prototype.advance,
    IDBCursor.prototype.continue,
    IDBCursor.prototype.continuePrimaryKey
  ]);
};
var promisifyRequest = function(request) {
  const promise = new Promise((resolve, reject) => {
    const unlisten = () => {
      request.removeEventListener("success", success);
      request.removeEventListener("error", error);
    };
    const success = () => {
      resolve(wrap(request.result));
      unlisten();
    };
    const error = () => {
      reject(request.error);
      unlisten();
    };
    request.addEventListener("success", success);
    request.addEventListener("error", error);
  });
  promise.then((value) => {
    if (value instanceof IDBCursor) {
      cursorRequestMap.set(value, request);
    }
  }).catch(() => {
  });
  reverseTransformCache.set(promise, request);
  return promise;
};
var cacheDonePromiseForTransaction = function(tx) {
  if (transactionDoneMap.has(tx))
    return;
  const done = new Promise((resolve, reject) => {
    const unlisten = () => {
      tx.removeEventListener("complete", complete);
      tx.removeEventListener("error", error);
      tx.removeEventListener("abort", error);
    };
    const complete = () => {
      resolve();
      unlisten();
    };
    const error = () => {
      reject(tx.error || new DOMException("AbortError", "AbortError"));
      unlisten();
    };
    tx.addEventListener("complete", complete);
    tx.addEventListener("error", error);
    tx.addEventListener("abort", error);
  });
  transactionDoneMap.set(tx, done);
};
var replaceTraps = function(callback) {
  idbProxyTraps = callback(idbProxyTraps);
};
var wrapFunction = function(func) {
  if (func === IDBDatabase.prototype.transaction && !("objectStoreNames" in IDBTransaction.prototype)) {
    return function(storeNames, ...args) {
      const tx = func.call(unwrap(this), storeNames, ...args);
      transactionStoreNamesMap.set(tx, storeNames.sort ? storeNames.sort() : [storeNames]);
      return wrap(tx);
    };
  }
  if (getCursorAdvanceMethods().includes(func)) {
    return function(...args) {
      func.apply(unwrap(this), args);
      return wrap(cursorRequestMap.get(this));
    };
  }
  return function(...args) {
    return wrap(func.apply(unwrap(this), args));
  };
};
var transformCachableValue = function(value) {
  if (typeof value === "function")
    return wrapFunction(value);
  if (value instanceof IDBTransaction)
    cacheDonePromiseForTransaction(value);
  if (instanceOfAny(value, getIdbProxyableTypes()))
    return new Proxy(value, idbProxyTraps);
  return value;
};
var wrap = function(value) {
  if (value instanceof IDBRequest)
    return promisifyRequest(value);
  if (transformCache.has(value))
    return transformCache.get(value);
  const newValue = transformCachableValue(value);
  if (newValue !== value) {
    transformCache.set(value, newValue);
    reverseTransformCache.set(newValue, value);
  }
  return newValue;
};
var instanceOfAny = (object, constructors) => constructors.some((c) => object instanceof c);
var idbProxyableTypes;
var cursorAdvanceMethods;
var cursorRequestMap = new WeakMap;
var transactionDoneMap = new WeakMap;
var transactionStoreNamesMap = new WeakMap;
var transformCache = new WeakMap;
var reverseTransformCache = new WeakMap;
var idbProxyTraps = {
  get(target, prop, receiver) {
    if (target instanceof IDBTransaction) {
      if (prop === "done")
        return transactionDoneMap.get(target);
      if (prop === "objectStoreNames") {
        return target.objectStoreNames || transactionStoreNamesMap.get(target);
      }
      if (prop === "store") {
        return receiver.objectStoreNames[1] ? undefined : receiver.objectStore(receiver.objectStoreNames[0]);
      }
    }
    return wrap(target[prop]);
  },
  set(target, prop, value) {
    target[prop] = value;
    return true;
  },
  has(target, prop) {
    if (target instanceof IDBTransaction && (prop === "done" || prop === "store")) {
      return true;
    }
    return prop in target;
  }
};
var unwrap = (value) => reverseTransformCache.get(value);

// node_modules/idb/build/index.js
var openDB = function(name, version, { blocked, upgrade, blocking, terminated } = {}) {
  const request = indexedDB.open(name, version);
  const openPromise = wrap(request);
  if (upgrade) {
    request.addEventListener("upgradeneeded", (event) => {
      upgrade(wrap(request.result), event.oldVersion, event.newVersion, wrap(request.transaction), event);
    });
  }
  if (blocked) {
    request.addEventListener("blocked", (event) => blocked(event.oldVersion, event.newVersion, event));
  }
  openPromise.then((db) => {
    if (terminated)
      db.addEventListener("close", () => terminated());
    if (blocking) {
      db.addEventListener("versionchange", (event) => blocking(event.oldVersion, event.newVersion, event));
    }
  }).catch(() => {
  });
  return openPromise;
};
var getMethod = function(target, prop) {
  if (!(target instanceof IDBDatabase && !(prop in target) && typeof prop === "string")) {
    return;
  }
  if (cachedMethods.get(prop))
    return cachedMethods.get(prop);
  const targetFuncName = prop.replace(/FromIndex$/, "");
  const useIndex = prop !== targetFuncName;
  const isWrite = writeMethods.includes(targetFuncName);
  if (!(targetFuncName in (useIndex ? IDBIndex : IDBObjectStore).prototype) || !(isWrite || readMethods.includes(targetFuncName))) {
    return;
  }
  const method = async function(storeName, ...args) {
    const tx = this.transaction(storeName, isWrite ? "readwrite" : "readonly");
    let target2 = tx.store;
    if (useIndex)
      target2 = target2.index(args.shift());
    return (await Promise.all([
      target2[targetFuncName](...args),
      isWrite && tx.done
    ]))[0];
  };
  cachedMethods.set(prop, method);
  return method;
};
var readMethods = ["get", "getKey", "getAll", "getAllKeys", "count"];
var writeMethods = ["put", "add", "delete", "clear"];
var cachedMethods = new Map;
replaceTraps((oldTraps) => ({
  ...oldTraps,
  get: (target, prop, receiver) => getMethod(target, prop) || oldTraps.get(target, prop, receiver),
  has: (target, prop) => !!getMethod(target, prop) || oldTraps.has(target, prop)
}));

// node_modules/@firebase/app/dist/esm/index.esm2017.js
var isVersionServiceProvider = function(provider) {
  const component2 = provider.getComponent();
  return (component2 === null || component2 === undefined ? undefined : component2.type) === "VERSION";
};
var _addComponent = function(app, component2) {
  try {
    app.container.addComponent(component2);
  } catch (e) {
    logger2.debug(`Component ${component2.name} failed to register with FirebaseApp ${app.name}`, e);
  }
};
var _registerComponent = function(component2) {
  const componentName = component2.name;
  if (_components.has(componentName)) {
    logger2.debug(`There were multiple attempts to register component ${componentName}.`);
    return false;
  }
  _components.set(componentName, component2);
  for (const app of _apps.values()) {
    _addComponent(app, component2);
  }
  for (const serverApp of _serverApps.values()) {
    _addComponent(serverApp, component2);
  }
  return true;
};
var _getProvider = function(app, name) {
  const heartbeatController = app.container.getProvider("heartbeat").getImmediate({ optional: true });
  if (heartbeatController) {
    heartbeatController.triggerHeartbeat();
  }
  return app.container.getProvider(name);
};
var initializeApp = function(_options, rawConfig = {}) {
  let options = _options;
  if (typeof rawConfig !== "object") {
    const name2 = rawConfig;
    rawConfig = { name: name2 };
  }
  const config = Object.assign({ name: DEFAULT_ENTRY_NAME2, automaticDataCollectionEnabled: false }, rawConfig);
  const name = config.name;
  if (typeof name !== "string" || !name) {
    throw ERROR_FACTORY.create("bad-app-name", {
      appName: String(name)
    });
  }
  options || (options = getDefaultAppConfig());
  if (!options) {
    throw ERROR_FACTORY.create("no-options");
  }
  const existingApp = _apps.get(name);
  if (existingApp) {
    if (deepEqual(options, existingApp.options) && deepEqual(config, existingApp.config)) {
      return existingApp;
    } else {
      throw ERROR_FACTORY.create("duplicate-app", { appName: name });
    }
  }
  const container = new ComponentContainer(name);
  for (const component2 of _components.values()) {
    container.addComponent(component2);
  }
  const newApp = new FirebaseAppImpl(options, config, container);
  _apps.set(name, newApp);
  return newApp;
};
var getApp = function(name = DEFAULT_ENTRY_NAME2) {
  const app = _apps.get(name);
  if (!app && name === DEFAULT_ENTRY_NAME2 && getDefaultAppConfig()) {
    return initializeApp();
  }
  if (!app) {
    throw ERROR_FACTORY.create("no-app", { appName: name });
  }
  return app;
};
var registerVersion = function(libraryKeyOrName, version, variant) {
  var _a;
  let library = (_a = PLATFORM_LOG_STRING[libraryKeyOrName]) !== null && _a !== undefined ? _a : libraryKeyOrName;
  if (variant) {
    library += `-${variant}`;
  }
  const libraryMismatch = library.match(/\s|\//);
  const versionMismatch = version.match(/\s|\//);
  if (libraryMismatch || versionMismatch) {
    const warning = [
      `Unable to register library "${library}" with version "${version}":`
    ];
    if (libraryMismatch) {
      warning.push(`library name "${library}" contains illegal characters (whitespace or "/")`);
    }
    if (libraryMismatch && versionMismatch) {
      warning.push("and");
    }
    if (versionMismatch) {
      warning.push(`version name "${version}" contains illegal characters (whitespace or "/")`);
    }
    logger2.warn(warning.join(" "));
    return;
  }
  _registerComponent(new Component(`${library}-version`, () => ({ library, version }), "VERSION"));
};
var getDbPromise = function() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade: (db, oldVersion) => {
        switch (oldVersion) {
          case 0:
            try {
              db.createObjectStore(STORE_NAME);
            } catch (e) {
              console.warn(e);
            }
        }
      }
    }).catch((e) => {
      throw ERROR_FACTORY.create("idb-open", {
        originalErrorMessage: e.message
      });
    });
  }
  return dbPromise;
};
async function readHeartbeatsFromIndexedDB(app) {
  try {
    const db = await getDbPromise();
    const tx = db.transaction(STORE_NAME);
    const result = await tx.objectStore(STORE_NAME).get(computeKey(app));
    await tx.done;
    return result;
  } catch (e) {
    if (e instanceof FirebaseError) {
      logger2.warn(e.message);
    } else {
      const idbGetError = ERROR_FACTORY.create("idb-get", {
        originalErrorMessage: e === null || e === undefined ? undefined : e.message
      });
      logger2.warn(idbGetError.message);
    }
  }
}
async function writeHeartbeatsToIndexedDB(app, heartbeatObject) {
  try {
    const db = await getDbPromise();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const objectStore = tx.objectStore(STORE_NAME);
    await objectStore.put(heartbeatObject, computeKey(app));
    await tx.done;
  } catch (e) {
    if (e instanceof FirebaseError) {
      logger2.warn(e.message);
    } else {
      const idbGetError = ERROR_FACTORY.create("idb-set", {
        originalErrorMessage: e === null || e === undefined ? undefined : e.message
      });
      logger2.warn(idbGetError.message);
    }
  }
}
var computeKey = function(app) {
  return `${app.name}!${app.options.appId}`;
};
var getUTCDateString = function() {
  const today = new Date;
  return today.toISOString().substring(0, 10);
};
var extractHeartbeatsForHeader = function(heartbeatsCache, maxSize = MAX_HEADER_BYTES) {
  const heartbeatsToSend = [];
  let unsentEntries = heartbeatsCache.slice();
  for (const singleDateHeartbeat of heartbeatsCache) {
    const heartbeatEntry = heartbeatsToSend.find((hb) => hb.agent === singleDateHeartbeat.agent);
    if (!heartbeatEntry) {
      heartbeatsToSend.push({
        agent: singleDateHeartbeat.agent,
        dates: [singleDateHeartbeat.date]
      });
      if (countBytes(heartbeatsToSend) > maxSize) {
        heartbeatsToSend.pop();
        break;
      }
    } else {
      heartbeatEntry.dates.push(singleDateHeartbeat.date);
      if (countBytes(heartbeatsToSend) > maxSize) {
        heartbeatEntry.dates.pop();
        break;
      }
    }
    unsentEntries = unsentEntries.slice(1);
  }
  return {
    heartbeatsToSend,
    unsentEntries
  };
};
var countBytes = function(heartbeatsCache) {
  return base64urlEncodeWithoutPadding(JSON.stringify({ version: 2, heartbeats: heartbeatsCache })).length;
};
var registerCoreComponents = function(variant) {
  _registerComponent(new Component("platform-logger", (container) => new PlatformLoggerServiceImpl(container), "PRIVATE"));
  _registerComponent(new Component("heartbeat", (container) => new HeartbeatServiceImpl(container), "PRIVATE"));
  registerVersion(name$q, version$1, variant);
  registerVersion(name$q, version$1, "esm2017");
  registerVersion("fire-js", "");
};

class PlatformLoggerServiceImpl {
  constructor(container) {
    this.container = container;
  }
  getPlatformInfoString() {
    const providers = this.container.getProviders();
    return providers.map((provider) => {
      if (isVersionServiceProvider(provider)) {
        const service = provider.getImmediate();
        return `${service.library}/${service.version}`;
      } else {
        return null;
      }
    }).filter((logString) => logString).join(" ");
  }
}
var name$q = "@firebase/app";
var version$1 = "0.10.17";
var logger2 = new Logger("@firebase/app");
var name$p = "@firebase/app-compat";
var name$o = "@firebase/analytics-compat";
var name$n = "@firebase/analytics";
var name$m = "@firebase/app-check-compat";
var name$l = "@firebase/app-check";
var name$k = "@firebase/auth";
var name$j = "@firebase/auth-compat";
var name$i = "@firebase/database";
var name$h = "@firebase/data-connect";
var name$g = "@firebase/database-compat";
var name$f = "@firebase/functions";
var name$e = "@firebase/functions-compat";
var name$d = "@firebase/installations";
var name$c = "@firebase/installations-compat";
var name$b = "@firebase/messaging";
var name$a = "@firebase/messaging-compat";
var name$9 = "@firebase/performance";
var name$8 = "@firebase/performance-compat";
var name$7 = "@firebase/remote-config";
var name$6 = "@firebase/remote-config-compat";
var name$5 = "@firebase/storage";
var name$4 = "@firebase/storage-compat";
var name$3 = "@firebase/firestore";
var name$2 = "@firebase/vertexai";
var name$1 = "@firebase/firestore-compat";
var name = "firebase";
var DEFAULT_ENTRY_NAME2 = "[DEFAULT]";
var PLATFORM_LOG_STRING = {
  [name$q]: "fire-core",
  [name$p]: "fire-core-compat",
  [name$n]: "fire-analytics",
  [name$o]: "fire-analytics-compat",
  [name$l]: "fire-app-check",
  [name$m]: "fire-app-check-compat",
  [name$k]: "fire-auth",
  [name$j]: "fire-auth-compat",
  [name$i]: "fire-rtdb",
  [name$h]: "fire-data-connect",
  [name$g]: "fire-rtdb-compat",
  [name$f]: "fire-fn",
  [name$e]: "fire-fn-compat",
  [name$d]: "fire-iid",
  [name$c]: "fire-iid-compat",
  [name$b]: "fire-fcm",
  [name$a]: "fire-fcm-compat",
  [name$9]: "fire-perf",
  [name$8]: "fire-perf-compat",
  [name$7]: "fire-rc",
  [name$6]: "fire-rc-compat",
  [name$5]: "fire-gcs",
  [name$4]: "fire-gcs-compat",
  [name$3]: "fire-fst",
  [name$1]: "fire-fst-compat",
  [name$2]: "fire-vertex",
  "fire-js": "fire-js",
  [name]: "fire-js-all"
};
var _apps = new Map;
var _serverApps = new Map;
var _components = new Map;
var ERRORS = {
  ["no-app"]: "No Firebase App '{$appName}' has been created - call initializeApp() first",
  ["bad-app-name"]: "Illegal App name: '{$appName}'",
  ["duplicate-app"]: "Firebase App named '{$appName}' already exists with different options or config",
  ["app-deleted"]: "Firebase App named '{$appName}' already deleted",
  ["server-app-deleted"]: "Firebase Server App has been deleted",
  ["no-options"]: "Need to provide options, when not being deployed to hosting via source.",
  ["invalid-app-argument"]: "firebase.{$appName}() takes either no argument or a Firebase App instance.",
  ["invalid-log-argument"]: "First argument to `onLog` must be null or a function.",
  ["idb-open"]: "Error thrown when opening IndexedDB. Original error: {$originalErrorMessage}.",
  ["idb-get"]: "Error thrown when reading from IndexedDB. Original error: {$originalErrorMessage}.",
  ["idb-set"]: "Error thrown when writing to IndexedDB. Original error: {$originalErrorMessage}.",
  ["idb-delete"]: "Error thrown when deleting from IndexedDB. Original error: {$originalErrorMessage}.",
  ["finalization-registry-not-supported"]: "FirebaseServerApp deleteOnDeref field defined but the JS runtime does not support FinalizationRegistry.",
  ["invalid-server-app-environment"]: "FirebaseServerApp is not for use in browser environments."
};
var ERROR_FACTORY = new ErrorFactory("app", "Firebase", ERRORS);

class FirebaseAppImpl {
  constructor(options, config, container) {
    this._isDeleted = false;
    this._options = Object.assign({}, options);
    this._config = Object.assign({}, config);
    this._name = config.name;
    this._automaticDataCollectionEnabled = config.automaticDataCollectionEnabled;
    this._container = container;
    this.container.addComponent(new Component("app", () => this, "PUBLIC"));
  }
  get automaticDataCollectionEnabled() {
    this.checkDestroyed();
    return this._automaticDataCollectionEnabled;
  }
  set automaticDataCollectionEnabled(val) {
    this.checkDestroyed();
    this._automaticDataCollectionEnabled = val;
  }
  get name() {
    this.checkDestroyed();
    return this._name;
  }
  get options() {
    this.checkDestroyed();
    return this._options;
  }
  get config() {
    this.checkDestroyed();
    return this._config;
  }
  get container() {
    return this._container;
  }
  get isDeleted() {
    return this._isDeleted;
  }
  set isDeleted(val) {
    this._isDeleted = val;
  }
  checkDestroyed() {
    if (this.isDeleted) {
      throw ERROR_FACTORY.create("app-deleted", { appName: this._name });
    }
  }
}
var DB_NAME = "firebase-heartbeat-database";
var DB_VERSION = 1;
var STORE_NAME = "firebase-heartbeat-store";
var dbPromise = null;
var MAX_HEADER_BYTES = 1024;
var STORED_HEARTBEAT_RETENTION_MAX_MILLIS = 30 * 24 * 60 * 60 * 1000;

class HeartbeatServiceImpl {
  constructor(container) {
    this.container = container;
    this._heartbeatsCache = null;
    const app = this.container.getProvider("app").getImmediate();
    this._storage = new HeartbeatStorageImpl(app);
    this._heartbeatsCachePromise = this._storage.read().then((result) => {
      this._heartbeatsCache = result;
      return result;
    });
  }
  async triggerHeartbeat() {
    var _a, _b;
    try {
      const platformLogger = this.container.getProvider("platform-logger").getImmediate();
      const agent = platformLogger.getPlatformInfoString();
      const date = getUTCDateString();
      if (((_a = this._heartbeatsCache) === null || _a === undefined ? undefined : _a.heartbeats) == null) {
        this._heartbeatsCache = await this._heartbeatsCachePromise;
        if (((_b = this._heartbeatsCache) === null || _b === undefined ? undefined : _b.heartbeats) == null) {
          return;
        }
      }
      if (this._heartbeatsCache.lastSentHeartbeatDate === date || this._heartbeatsCache.heartbeats.some((singleDateHeartbeat) => singleDateHeartbeat.date === date)) {
        return;
      } else {
        this._heartbeatsCache.heartbeats.push({ date, agent });
      }
      this._heartbeatsCache.heartbeats = this._heartbeatsCache.heartbeats.filter((singleDateHeartbeat) => {
        const hbTimestamp = new Date(singleDateHeartbeat.date).valueOf();
        const now = Date.now();
        return now - hbTimestamp <= STORED_HEARTBEAT_RETENTION_MAX_MILLIS;
      });
      return this._storage.overwrite(this._heartbeatsCache);
    } catch (e) {
      logger2.warn(e);
    }
  }
  async getHeartbeatsHeader() {
    var _a;
    try {
      if (this._heartbeatsCache === null) {
        await this._heartbeatsCachePromise;
      }
      if (((_a = this._heartbeatsCache) === null || _a === undefined ? undefined : _a.heartbeats) == null || this._heartbeatsCache.heartbeats.length === 0) {
        return "";
      }
      const date = getUTCDateString();
      const { heartbeatsToSend, unsentEntries } = extractHeartbeatsForHeader(this._heartbeatsCache.heartbeats);
      const headerString = base64urlEncodeWithoutPadding(JSON.stringify({ version: 2, heartbeats: heartbeatsToSend }));
      this._heartbeatsCache.lastSentHeartbeatDate = date;
      if (unsentEntries.length > 0) {
        this._heartbeatsCache.heartbeats = unsentEntries;
        await this._storage.overwrite(this._heartbeatsCache);
      } else {
        this._heartbeatsCache.heartbeats = [];
        this._storage.overwrite(this._heartbeatsCache);
      }
      return headerString;
    } catch (e) {
      logger2.warn(e);
      return "";
    }
  }
}

class HeartbeatStorageImpl {
  constructor(app) {
    this.app = app;
    this._canUseIndexedDBPromise = this.runIndexedDBEnvironmentCheck();
  }
  async runIndexedDBEnvironmentCheck() {
    if (!isIndexedDBAvailable()) {
      return false;
    } else {
      return validateIndexedDBOpenable().then(() => true).catch(() => false);
    }
  }
  async read() {
    const canUseIndexedDB = await this._canUseIndexedDBPromise;
    if (!canUseIndexedDB) {
      return { heartbeats: [] };
    } else {
      const idbHeartbeatObject = await readHeartbeatsFromIndexedDB(this.app);
      if (idbHeartbeatObject === null || idbHeartbeatObject === undefined ? undefined : idbHeartbeatObject.heartbeats) {
        return idbHeartbeatObject;
      } else {
        return { heartbeats: [] };
      }
    }
  }
  async overwrite(heartbeatsObject) {
    var _a;
    const canUseIndexedDB = await this._canUseIndexedDBPromise;
    if (!canUseIndexedDB) {
      return;
    } else {
      const existingHeartbeatsObject = await this.read();
      return writeHeartbeatsToIndexedDB(this.app, {
        lastSentHeartbeatDate: (_a = heartbeatsObject.lastSentHeartbeatDate) !== null && _a !== undefined ? _a : existingHeartbeatsObject.lastSentHeartbeatDate,
        heartbeats: heartbeatsObject.heartbeats
      });
    }
  }
  async add(heartbeatsObject) {
    var _a;
    const canUseIndexedDB = await this._canUseIndexedDBPromise;
    if (!canUseIndexedDB) {
      return;
    } else {
      const existingHeartbeatsObject = await this.read();
      return writeHeartbeatsToIndexedDB(this.app, {
        lastSentHeartbeatDate: (_a = heartbeatsObject.lastSentHeartbeatDate) !== null && _a !== undefined ? _a : existingHeartbeatsObject.lastSentHeartbeatDate,
        heartbeats: [
          ...existingHeartbeatsObject.heartbeats,
          ...heartbeatsObject.heartbeats
        ]
      });
    }
  }
}
registerCoreComponents("");

// node_modules/firebase/app/dist/esm/index.esm.js
var name2 = "firebase";
var version = "11.1.0";
registerVersion(name2, version, "app");

// node_modules/@firebase/installations/dist/esm/index.esm2017.js
var isServerError = function(error) {
  return error instanceof FirebaseError && error.code.includes("request-failed");
};
var getInstallationsEndpoint = function({ projectId }) {
  return `${INSTALLATIONS_API_URL}/projects/${projectId}/installations`;
};
var extractAuthTokenInfoFromResponse = function(response) {
  return {
    token: response.token,
    requestStatus: 2,
    expiresIn: getExpiresInFromResponseExpiresIn(response.expiresIn),
    creationTime: Date.now()
  };
};
async function getErrorFromResponse(requestName, response) {
  const responseJson = await response.json();
  const errorData = responseJson.error;
  return ERROR_FACTORY2.create("request-failed", {
    requestName,
    serverCode: errorData.code,
    serverMessage: errorData.message,
    serverStatus: errorData.status
  });
}
var getHeaders = function({ apiKey }) {
  return new Headers({
    "Content-Type": "application/json",
    Accept: "application/json",
    "x-goog-api-key": apiKey
  });
};
var getHeadersWithAuth = function(appConfig, { refreshToken }) {
  const headers = getHeaders(appConfig);
  headers.append("Authorization", getAuthorizationHeader(refreshToken));
  return headers;
};
async function retryIfServerError(fn) {
  const result = await fn();
  if (result.status >= 500 && result.status < 600) {
    return fn();
  }
  return result;
}
var getExpiresInFromResponseExpiresIn = function(responseExpiresIn) {
  return Number(responseExpiresIn.replace("s", "000"));
};
var getAuthorizationHeader = function(refreshToken) {
  return `${INTERNAL_AUTH_VERSION} ${refreshToken}`;
};
async function createInstallationRequest({ appConfig, heartbeatServiceProvider }, { fid }) {
  const endpoint = getInstallationsEndpoint(appConfig);
  const headers = getHeaders(appConfig);
  const heartbeatService = heartbeatServiceProvider.getImmediate({
    optional: true
  });
  if (heartbeatService) {
    const heartbeatsHeader = await heartbeatService.getHeartbeatsHeader();
    if (heartbeatsHeader) {
      headers.append("x-firebase-client", heartbeatsHeader);
    }
  }
  const body = {
    fid,
    authVersion: INTERNAL_AUTH_VERSION,
    appId: appConfig.appId,
    sdkVersion: PACKAGE_VERSION
  };
  const request = {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  };
  const response = await retryIfServerError(() => fetch(endpoint, request));
  if (response.ok) {
    const responseValue = await response.json();
    const registeredInstallationEntry = {
      fid: responseValue.fid || fid,
      registrationStatus: 2,
      refreshToken: responseValue.refreshToken,
      authToken: extractAuthTokenInfoFromResponse(responseValue.authToken)
    };
    return registeredInstallationEntry;
  } else {
    throw await getErrorFromResponse("Create Installation", response);
  }
}
var sleep = function(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};
var bufferToBase64UrlSafe = function(array) {
  const b64 = btoa(String.fromCharCode(...array));
  return b64.replace(/\+/g, "-").replace(/\//g, "_");
};
var generateFid = function() {
  try {
    const fidByteArray = new Uint8Array(17);
    const crypto = self.crypto || self.msCrypto;
    crypto.getRandomValues(fidByteArray);
    fidByteArray[0] = 112 + fidByteArray[0] % 16;
    const fid = encode(fidByteArray);
    return VALID_FID_PATTERN.test(fid) ? fid : INVALID_FID;
  } catch (_a) {
    return INVALID_FID;
  }
};
var encode = function(fidByteArray) {
  const b64String = bufferToBase64UrlSafe(fidByteArray);
  return b64String.substr(0, 22);
};
var getKey = function(appConfig) {
  return `${appConfig.appName}!${appConfig.appId}`;
};
var fidChanged = function(appConfig, fid) {
  const key = getKey(appConfig);
  callFidChangeCallbacks(key, fid);
  broadcastFidChange(key, fid);
};
var callFidChangeCallbacks = function(key, fid) {
  const callbacks = fidChangeCallbacks.get(key);
  if (!callbacks) {
    return;
  }
  for (const callback of callbacks) {
    callback(fid);
  }
};
var broadcastFidChange = function(key, fid) {
  const channel = getBroadcastChannel();
  if (channel) {
    channel.postMessage({ key, fid });
  }
  closeBroadcastChannel();
};
var getBroadcastChannel = function() {
  if (!broadcastChannel && "BroadcastChannel" in self) {
    broadcastChannel = new BroadcastChannel("[Firebase] FID Change");
    broadcastChannel.onmessage = (e) => {
      callFidChangeCallbacks(e.data.key, e.data.fid);
    };
  }
  return broadcastChannel;
};
var closeBroadcastChannel = function() {
  if (fidChangeCallbacks.size === 0 && broadcastChannel) {
    broadcastChannel.close();
    broadcastChannel = null;
  }
};
var getDbPromise2 = function() {
  if (!dbPromise2) {
    dbPromise2 = openDB(DATABASE_NAME, DATABASE_VERSION, {
      upgrade: (db, oldVersion) => {
        switch (oldVersion) {
          case 0:
            db.createObjectStore(OBJECT_STORE_NAME);
        }
      }
    });
  }
  return dbPromise2;
};
async function set(appConfig, value) {
  const key = getKey(appConfig);
  const db = await getDbPromise2();
  const tx = db.transaction(OBJECT_STORE_NAME, "readwrite");
  const objectStore = tx.objectStore(OBJECT_STORE_NAME);
  const oldValue = await objectStore.get(key);
  await objectStore.put(value, key);
  await tx.done;
  if (!oldValue || oldValue.fid !== value.fid) {
    fidChanged(appConfig, value.fid);
  }
  return value;
}
async function remove(appConfig) {
  const key = getKey(appConfig);
  const db = await getDbPromise2();
  const tx = db.transaction(OBJECT_STORE_NAME, "readwrite");
  await tx.objectStore(OBJECT_STORE_NAME).delete(key);
  await tx.done;
}
async function update(appConfig, updateFn) {
  const key = getKey(appConfig);
  const db = await getDbPromise2();
  const tx = db.transaction(OBJECT_STORE_NAME, "readwrite");
  const store = tx.objectStore(OBJECT_STORE_NAME);
  const oldValue = await store.get(key);
  const newValue = updateFn(oldValue);
  if (newValue === undefined) {
    await store.delete(key);
  } else {
    await store.put(newValue, key);
  }
  await tx.done;
  if (newValue && (!oldValue || oldValue.fid !== newValue.fid)) {
    fidChanged(appConfig, newValue.fid);
  }
  return newValue;
}
async function getInstallationEntry(installations) {
  let registrationPromise;
  const installationEntry = await update(installations.appConfig, (oldEntry) => {
    const installationEntry2 = updateOrCreateInstallationEntry(oldEntry);
    const entryWithPromise = triggerRegistrationIfNecessary(installations, installationEntry2);
    registrationPromise = entryWithPromise.registrationPromise;
    return entryWithPromise.installationEntry;
  });
  if (installationEntry.fid === INVALID_FID) {
    return { installationEntry: await registrationPromise };
  }
  return {
    installationEntry,
    registrationPromise
  };
}
var updateOrCreateInstallationEntry = function(oldEntry) {
  const entry = oldEntry || {
    fid: generateFid(),
    registrationStatus: 0
  };
  return clearTimedOutRequest(entry);
};
var triggerRegistrationIfNecessary = function(installations, installationEntry) {
  if (installationEntry.registrationStatus === 0) {
    if (!navigator.onLine) {
      const registrationPromiseWithError = Promise.reject(ERROR_FACTORY2.create("app-offline"));
      return {
        installationEntry,
        registrationPromise: registrationPromiseWithError
      };
    }
    const inProgressEntry = {
      fid: installationEntry.fid,
      registrationStatus: 1,
      registrationTime: Date.now()
    };
    const registrationPromise = registerInstallation(installations, inProgressEntry);
    return { installationEntry: inProgressEntry, registrationPromise };
  } else if (installationEntry.registrationStatus === 1) {
    return {
      installationEntry,
      registrationPromise: waitUntilFidRegistration(installations)
    };
  } else {
    return { installationEntry };
  }
};
async function registerInstallation(installations, installationEntry) {
  try {
    const registeredInstallationEntry = await createInstallationRequest(installations, installationEntry);
    return set(installations.appConfig, registeredInstallationEntry);
  } catch (e) {
    if (isServerError(e) && e.customData.serverCode === 409) {
      await remove(installations.appConfig);
    } else {
      await set(installations.appConfig, {
        fid: installationEntry.fid,
        registrationStatus: 0
      });
    }
    throw e;
  }
}
async function waitUntilFidRegistration(installations) {
  let entry = await updateInstallationRequest(installations.appConfig);
  while (entry.registrationStatus === 1) {
    await sleep(100);
    entry = await updateInstallationRequest(installations.appConfig);
  }
  if (entry.registrationStatus === 0) {
    const { installationEntry, registrationPromise } = await getInstallationEntry(installations);
    if (registrationPromise) {
      return registrationPromise;
    } else {
      return installationEntry;
    }
  }
  return entry;
}
var updateInstallationRequest = function(appConfig) {
  return update(appConfig, (oldEntry) => {
    if (!oldEntry) {
      throw ERROR_FACTORY2.create("installation-not-found");
    }
    return clearTimedOutRequest(oldEntry);
  });
};
var clearTimedOutRequest = function(entry) {
  if (hasInstallationRequestTimedOut(entry)) {
    return {
      fid: entry.fid,
      registrationStatus: 0
    };
  }
  return entry;
};
var hasInstallationRequestTimedOut = function(installationEntry) {
  return installationEntry.registrationStatus === 1 && installationEntry.registrationTime + PENDING_TIMEOUT_MS < Date.now();
};
async function generateAuthTokenRequest({ appConfig, heartbeatServiceProvider }, installationEntry) {
  const endpoint = getGenerateAuthTokenEndpoint(appConfig, installationEntry);
  const headers = getHeadersWithAuth(appConfig, installationEntry);
  const heartbeatService = heartbeatServiceProvider.getImmediate({
    optional: true
  });
  if (heartbeatService) {
    const heartbeatsHeader = await heartbeatService.getHeartbeatsHeader();
    if (heartbeatsHeader) {
      headers.append("x-firebase-client", heartbeatsHeader);
    }
  }
  const body = {
    installation: {
      sdkVersion: PACKAGE_VERSION,
      appId: appConfig.appId
    }
  };
  const request = {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  };
  const response = await retryIfServerError(() => fetch(endpoint, request));
  if (response.ok) {
    const responseValue = await response.json();
    const completedAuthToken = extractAuthTokenInfoFromResponse(responseValue);
    return completedAuthToken;
  } else {
    throw await getErrorFromResponse("Generate Auth Token", response);
  }
}
var getGenerateAuthTokenEndpoint = function(appConfig, { fid }) {
  return `${getInstallationsEndpoint(appConfig)}/${fid}/authTokens:generate`;
};
async function refreshAuthToken(installations, forceRefresh = false) {
  let tokenPromise;
  const entry = await update(installations.appConfig, (oldEntry) => {
    if (!isEntryRegistered(oldEntry)) {
      throw ERROR_FACTORY2.create("not-registered");
    }
    const oldAuthToken = oldEntry.authToken;
    if (!forceRefresh && isAuthTokenValid(oldAuthToken)) {
      return oldEntry;
    } else if (oldAuthToken.requestStatus === 1) {
      tokenPromise = waitUntilAuthTokenRequest(installations, forceRefresh);
      return oldEntry;
    } else {
      if (!navigator.onLine) {
        throw ERROR_FACTORY2.create("app-offline");
      }
      const inProgressEntry = makeAuthTokenRequestInProgressEntry(oldEntry);
      tokenPromise = fetchAuthTokenFromServer(installations, inProgressEntry);
      return inProgressEntry;
    }
  });
  const authToken = tokenPromise ? await tokenPromise : entry.authToken;
  return authToken;
}
async function waitUntilAuthTokenRequest(installations, forceRefresh) {
  let entry = await updateAuthTokenRequest(installations.appConfig);
  while (entry.authToken.requestStatus === 1) {
    await sleep(100);
    entry = await updateAuthTokenRequest(installations.appConfig);
  }
  const authToken = entry.authToken;
  if (authToken.requestStatus === 0) {
    return refreshAuthToken(installations, forceRefresh);
  } else {
    return authToken;
  }
}
var updateAuthTokenRequest = function(appConfig) {
  return update(appConfig, (oldEntry) => {
    if (!isEntryRegistered(oldEntry)) {
      throw ERROR_FACTORY2.create("not-registered");
    }
    const oldAuthToken = oldEntry.authToken;
    if (hasAuthTokenRequestTimedOut(oldAuthToken)) {
      return Object.assign(Object.assign({}, oldEntry), { authToken: { requestStatus: 0 } });
    }
    return oldEntry;
  });
};
async function fetchAuthTokenFromServer(installations, installationEntry) {
  try {
    const authToken = await generateAuthTokenRequest(installations, installationEntry);
    const updatedInstallationEntry = Object.assign(Object.assign({}, installationEntry), { authToken });
    await set(installations.appConfig, updatedInstallationEntry);
    return authToken;
  } catch (e) {
    if (isServerError(e) && (e.customData.serverCode === 401 || e.customData.serverCode === 404)) {
      await remove(installations.appConfig);
    } else {
      const updatedInstallationEntry = Object.assign(Object.assign({}, installationEntry), { authToken: { requestStatus: 0 } });
      await set(installations.appConfig, updatedInstallationEntry);
    }
    throw e;
  }
}
var isEntryRegistered = function(installationEntry) {
  return installationEntry !== undefined && installationEntry.registrationStatus === 2;
};
var isAuthTokenValid = function(authToken) {
  return authToken.requestStatus === 2 && !isAuthTokenExpired(authToken);
};
var isAuthTokenExpired = function(authToken) {
  const now = Date.now();
  return now < authToken.creationTime || authToken.creationTime + authToken.expiresIn < now + TOKEN_EXPIRATION_BUFFER;
};
var makeAuthTokenRequestInProgressEntry = function(oldEntry) {
  const inProgressAuthToken = {
    requestStatus: 1,
    requestTime: Date.now()
  };
  return Object.assign(Object.assign({}, oldEntry), { authToken: inProgressAuthToken });
};
var hasAuthTokenRequestTimedOut = function(authToken) {
  return authToken.requestStatus === 1 && authToken.requestTime + PENDING_TIMEOUT_MS < Date.now();
};
async function getId(installations) {
  const installationsImpl = installations;
  const { installationEntry, registrationPromise } = await getInstallationEntry(installationsImpl);
  if (registrationPromise) {
    registrationPromise.catch(console.error);
  } else {
    refreshAuthToken(installationsImpl).catch(console.error);
  }
  return installationEntry.fid;
}
async function getToken(installations, forceRefresh = false) {
  const installationsImpl = installations;
  await completeInstallationRegistration(installationsImpl);
  const authToken = await refreshAuthToken(installationsImpl, forceRefresh);
  return authToken.token;
}
async function completeInstallationRegistration(installations) {
  const { registrationPromise } = await getInstallationEntry(installations);
  if (registrationPromise) {
    await registrationPromise;
  }
}
var extractAppConfig = function(app4) {
  if (!app4 || !app4.options) {
    throw getMissingValueError("App Configuration");
  }
  if (!app4.name) {
    throw getMissingValueError("App Name");
  }
  const configKeys = [
    "projectId",
    "apiKey",
    "appId"
  ];
  for (const keyName of configKeys) {
    if (!app4.options[keyName]) {
      throw getMissingValueError(keyName);
    }
  }
  return {
    appName: app4.name,
    projectId: app4.options.projectId,
    apiKey: app4.options.apiKey,
    appId: app4.options.appId
  };
};
var getMissingValueError = function(valueName) {
  return ERROR_FACTORY2.create("missing-app-config-values", {
    valueName
  });
};
var registerInstallations = function() {
  _registerComponent(new Component(INSTALLATIONS_NAME, publicFactory, "PUBLIC"));
  _registerComponent(new Component(INSTALLATIONS_NAME_INTERNAL, internalFactory, "PRIVATE"));
};
var name3 = "@firebase/installations";
var version2 = "0.6.11";
var PENDING_TIMEOUT_MS = 1e4;
var PACKAGE_VERSION = `w:${version2}`;
var INTERNAL_AUTH_VERSION = "FIS_v2";
var INSTALLATIONS_API_URL = "https://firebaseinstallations.googleapis.com/v1";
var TOKEN_EXPIRATION_BUFFER = 60 * 60 * 1000;
var SERVICE = "installations";
var SERVICE_NAME = "Installations";
var ERROR_DESCRIPTION_MAP = {
  ["missing-app-config-values"]: 'Missing App configuration value: "{$valueName}"',
  ["not-registered"]: "Firebase Installation is not registered.",
  ["installation-not-found"]: "Firebase Installation not found.",
  ["request-failed"]: '{$requestName} request failed with error "{$serverCode} {$serverStatus}: {$serverMessage}"',
  ["app-offline"]: "Could not process request. Application offline.",
  ["delete-pending-registration"]: "Can't delete installation while there is a pending registration request."
};
var ERROR_FACTORY2 = new ErrorFactory(SERVICE, SERVICE_NAME, ERROR_DESCRIPTION_MAP);
var VALID_FID_PATTERN = /^[cdef][\w-]{21}$/;
var INVALID_FID = "";
var fidChangeCallbacks = new Map;
var broadcastChannel = null;
var DATABASE_NAME = "firebase-installations-database";
var DATABASE_VERSION = 1;
var OBJECT_STORE_NAME = "firebase-installations-store";
var dbPromise2 = null;
var INSTALLATIONS_NAME = "installations";
var INSTALLATIONS_NAME_INTERNAL = "installations-internal";
var publicFactory = (container) => {
  const app4 = container.getProvider("app").getImmediate();
  const appConfig = extractAppConfig(app4);
  const heartbeatServiceProvider = _getProvider(app4, "heartbeat");
  const installationsImpl = {
    app: app4,
    appConfig,
    heartbeatServiceProvider,
    _delete: () => Promise.resolve()
  };
  return installationsImpl;
};
var internalFactory = (container) => {
  const app4 = container.getProvider("app").getImmediate();
  const installations = _getProvider(app4, INSTALLATIONS_NAME).getImmediate();
  const installationsInternal = {
    getId: () => getId(installations),
    getToken: (forceRefresh) => getToken(installations, forceRefresh)
  };
  return installationsInternal;
};
registerInstallations();
registerVersion(name3, version2);
registerVersion(name3, version2, "esm2017");

// node_modules/@firebase/analytics/dist/esm/index.esm2017.js
var createGtagTrustedTypesScriptURL = function(url) {
  if (!url.startsWith(GTAG_URL)) {
    const err = ERROR_FACTORY3.create("invalid-gtag-resource", {
      gtagURL: url
    });
    logger4.warn(err.message);
    return "";
  }
  return url;
};
var promiseAllSettled = function(promises) {
  return Promise.all(promises.map((promise) => promise.catch((e) => e)));
};
var createTrustedTypesPolicy = function(policyName, policyOptions) {
  let trustedTypesPolicy;
  if (window.trustedTypes) {
    trustedTypesPolicy = window.trustedTypes.createPolicy(policyName, policyOptions);
  }
  return trustedTypesPolicy;
};
var insertScriptTag = function(dataLayerName, measurementId) {
  const trustedTypesPolicy = createTrustedTypesPolicy("firebase-js-sdk-policy", {
    createScriptURL: createGtagTrustedTypesScriptURL
  });
  const script = document.createElement("script");
  const gtagScriptURL = `${GTAG_URL}?l=${dataLayerName}&id=${measurementId}`;
  script.src = trustedTypesPolicy ? trustedTypesPolicy === null || trustedTypesPolicy === undefined ? undefined : trustedTypesPolicy.createScriptURL(gtagScriptURL) : gtagScriptURL;
  script.async = true;
  document.head.appendChild(script);
};
var getOrCreateDataLayer = function(dataLayerName) {
  let dataLayer = [];
  if (Array.isArray(window[dataLayerName])) {
    dataLayer = window[dataLayerName];
  } else {
    window[dataLayerName] = dataLayer;
  }
  return dataLayer;
};
async function gtagOnConfig(gtagCore, initializationPromisesMap, dynamicConfigPromisesList, measurementIdToAppId, measurementId, gtagParams) {
  const correspondingAppId = measurementIdToAppId[measurementId];
  try {
    if (correspondingAppId) {
      await initializationPromisesMap[correspondingAppId];
    } else {
      const dynamicConfigResults = await promiseAllSettled(dynamicConfigPromisesList);
      const foundConfig = dynamicConfigResults.find((config) => config.measurementId === measurementId);
      if (foundConfig) {
        await initializationPromisesMap[foundConfig.appId];
      }
    }
  } catch (e) {
    logger4.error(e);
  }
  gtagCore("config", measurementId, gtagParams);
}
async function gtagOnEvent(gtagCore, initializationPromisesMap, dynamicConfigPromisesList, measurementId, gtagParams) {
  try {
    let initializationPromisesToWaitFor = [];
    if (gtagParams && gtagParams["send_to"]) {
      let gaSendToList = gtagParams["send_to"];
      if (!Array.isArray(gaSendToList)) {
        gaSendToList = [gaSendToList];
      }
      const dynamicConfigResults = await promiseAllSettled(dynamicConfigPromisesList);
      for (const sendToId of gaSendToList) {
        const foundConfig = dynamicConfigResults.find((config) => config.measurementId === sendToId);
        const initializationPromise = foundConfig && initializationPromisesMap[foundConfig.appId];
        if (initializationPromise) {
          initializationPromisesToWaitFor.push(initializationPromise);
        } else {
          initializationPromisesToWaitFor = [];
          break;
        }
      }
    }
    if (initializationPromisesToWaitFor.length === 0) {
      initializationPromisesToWaitFor = Object.values(initializationPromisesMap);
    }
    await Promise.all(initializationPromisesToWaitFor);
    gtagCore("event", measurementId, gtagParams || {});
  } catch (e) {
    logger4.error(e);
  }
}
var wrapGtag = function(gtagCore, initializationPromisesMap, dynamicConfigPromisesList, measurementIdToAppId) {
  async function gtagWrapper(command, ...args) {
    try {
      if (command === "event") {
        const [measurementId, gtagParams] = args;
        await gtagOnEvent(gtagCore, initializationPromisesMap, dynamicConfigPromisesList, measurementId, gtagParams);
      } else if (command === "config") {
        const [measurementId, gtagParams] = args;
        await gtagOnConfig(gtagCore, initializationPromisesMap, dynamicConfigPromisesList, measurementIdToAppId, measurementId, gtagParams);
      } else if (command === "consent") {
        const [consentAction, gtagParams] = args;
        gtagCore("consent", consentAction, gtagParams);
      } else if (command === "get") {
        const [measurementId, fieldName, callback] = args;
        gtagCore("get", measurementId, fieldName, callback);
      } else if (command === "set") {
        const [customParams] = args;
        gtagCore("set", customParams);
      } else {
        gtagCore(command, ...args);
      }
    } catch (e) {
      logger4.error(e);
    }
  }
  return gtagWrapper;
};
var wrapOrCreateGtag = function(initializationPromisesMap, dynamicConfigPromisesList, measurementIdToAppId, dataLayerName, gtagFunctionName) {
  let gtagCore = function(..._args) {
    window[dataLayerName].push(arguments);
  };
  if (window[gtagFunctionName] && typeof window[gtagFunctionName] === "function") {
    gtagCore = window[gtagFunctionName];
  }
  window[gtagFunctionName] = wrapGtag(gtagCore, initializationPromisesMap, dynamicConfigPromisesList, measurementIdToAppId);
  return {
    gtagCore,
    wrappedGtag: window[gtagFunctionName]
  };
};
var findGtagScriptOnPage = function(dataLayerName) {
  const scriptTags = window.document.getElementsByTagName("script");
  for (const tag of Object.values(scriptTags)) {
    if (tag.src && tag.src.includes(GTAG_URL) && tag.src.includes(dataLayerName)) {
      return tag;
    }
  }
  return null;
};
var getHeaders2 = function(apiKey) {
  return new Headers({
    Accept: "application/json",
    "x-goog-api-key": apiKey
  });
};
async function fetchDynamicConfig(appFields) {
  var _a;
  const { appId, apiKey } = appFields;
  const request = {
    method: "GET",
    headers: getHeaders2(apiKey)
  };
  const appUrl = DYNAMIC_CONFIG_URL.replace("{app-id}", appId);
  const response = await fetch(appUrl, request);
  if (response.status !== 200 && response.status !== 304) {
    let errorMessage = "";
    try {
      const jsonResponse = await response.json();
      if ((_a = jsonResponse.error) === null || _a === undefined ? undefined : _a.message) {
        errorMessage = jsonResponse.error.message;
      }
    } catch (_ignored) {
    }
    throw ERROR_FACTORY3.create("config-fetch-failed", {
      httpStatus: response.status,
      responseMessage: errorMessage
    });
  }
  return response.json();
}
async function fetchDynamicConfigWithRetry(app5, retryData = defaultRetryData, timeoutMillis) {
  const { appId, apiKey, measurementId } = app5.options;
  if (!appId) {
    throw ERROR_FACTORY3.create("no-app-id");
  }
  if (!apiKey) {
    if (measurementId) {
      return {
        measurementId,
        appId
      };
    }
    throw ERROR_FACTORY3.create("no-api-key");
  }
  const throttleMetadata = retryData.getThrottleMetadata(appId) || {
    backoffCount: 0,
    throttleEndTimeMillis: Date.now()
  };
  const signal = new AnalyticsAbortSignal;
  setTimeout(async () => {
    signal.abort();
  }, timeoutMillis !== undefined ? timeoutMillis : FETCH_TIMEOUT_MILLIS);
  return attemptFetchDynamicConfigWithRetry({ appId, apiKey, measurementId }, throttleMetadata, signal, retryData);
}
async function attemptFetchDynamicConfigWithRetry(appFields, { throttleEndTimeMillis, backoffCount }, signal, retryData = defaultRetryData) {
  var _a;
  const { appId, measurementId } = appFields;
  try {
    await setAbortableTimeout(signal, throttleEndTimeMillis);
  } catch (e) {
    if (measurementId) {
      logger4.warn(`Timed out fetching this Firebase app's measurement ID from the server.` + ` Falling back to the measurement ID ${measurementId}` + ` provided in the "measurementId" field in the local Firebase config. [${e === null || e === undefined ? undefined : e.message}]`);
      return { appId, measurementId };
    }
    throw e;
  }
  try {
    const response = await fetchDynamicConfig(appFields);
    retryData.deleteThrottleMetadata(appId);
    return response;
  } catch (e) {
    const error = e;
    if (!isRetriableError(error)) {
      retryData.deleteThrottleMetadata(appId);
      if (measurementId) {
        logger4.warn(`Failed to fetch this Firebase app's measurement ID from the server.` + ` Falling back to the measurement ID ${measurementId}` + ` provided in the "measurementId" field in the local Firebase config. [${error === null || error === undefined ? undefined : error.message}]`);
        return { appId, measurementId };
      } else {
        throw e;
      }
    }
    const backoffMillis = Number((_a = error === null || error === undefined ? undefined : error.customData) === null || _a === undefined ? undefined : _a.httpStatus) === 503 ? calculateBackoffMillis(backoffCount, retryData.intervalMillis, LONG_RETRY_FACTOR) : calculateBackoffMillis(backoffCount, retryData.intervalMillis);
    const throttleMetadata = {
      throttleEndTimeMillis: Date.now() + backoffMillis,
      backoffCount: backoffCount + 1
    };
    retryData.setThrottleMetadata(appId, throttleMetadata);
    logger4.debug(`Calling attemptFetch again in ${backoffMillis} millis`);
    return attemptFetchDynamicConfigWithRetry(appFields, throttleMetadata, signal, retryData);
  }
}
var setAbortableTimeout = function(signal, throttleEndTimeMillis) {
  return new Promise((resolve, reject) => {
    const backoffMillis = Math.max(throttleEndTimeMillis - Date.now(), 0);
    const timeout = setTimeout(resolve, backoffMillis);
    signal.addEventListener(() => {
      clearTimeout(timeout);
      reject(ERROR_FACTORY3.create("fetch-throttle", {
        throttleEndTimeMillis
      }));
    });
  });
};
var isRetriableError = function(e) {
  if (!(e instanceof FirebaseError) || !e.customData) {
    return false;
  }
  const httpStatus = Number(e.customData["httpStatus"]);
  return httpStatus === 429 || httpStatus === 500 || httpStatus === 503 || httpStatus === 504;
};
async function logEvent$1(gtagFunction, initializationPromise, eventName, eventParams, options) {
  if (options && options.global) {
    gtagFunction("event", eventName, eventParams);
    return;
  } else {
    const measurementId = await initializationPromise;
    const params = Object.assign(Object.assign({}, eventParams), { send_to: measurementId });
    gtagFunction("event", eventName, params);
  }
}
var _setConsentDefaultForInit = function(consentSettings) {
  defaultConsentSettingsForInit = consentSettings;
};
var _setDefaultEventParametersForInit = function(customParams) {
  defaultEventParametersForInit = customParams;
};
async function validateIndexedDB() {
  if (!isIndexedDBAvailable()) {
    logger4.warn(ERROR_FACTORY3.create("indexeddb-unavailable", {
      errorInfo: "IndexedDB is not available in this environment."
    }).message);
    return false;
  } else {
    try {
      await validateIndexedDBOpenable();
    } catch (e) {
      logger4.warn(ERROR_FACTORY3.create("indexeddb-unavailable", {
        errorInfo: e === null || e === undefined ? undefined : e.toString()
      }).message);
      return false;
    }
  }
  return true;
}
async function _initializeAnalytics(app5, dynamicConfigPromisesList, measurementIdToAppId, installations2, gtagCore, dataLayerName, options) {
  var _a;
  const dynamicConfigPromise = fetchDynamicConfigWithRetry(app5);
  dynamicConfigPromise.then((config) => {
    measurementIdToAppId[config.measurementId] = config.appId;
    if (app5.options.measurementId && config.measurementId !== app5.options.measurementId) {
      logger4.warn(`The measurement ID in the local Firebase config (${app5.options.measurementId})` + ` does not match the measurement ID fetched from the server (${config.measurementId}).` + ` To ensure analytics events are always sent to the correct Analytics property, update the measurement ID field in the local config or remove it from the local config.`);
    }
  }).catch((e) => logger4.error(e));
  dynamicConfigPromisesList.push(dynamicConfigPromise);
  const fidPromise = validateIndexedDB().then((envIsValid) => {
    if (envIsValid) {
      return installations2.getId();
    } else {
      return;
    }
  });
  const [dynamicConfig, fid] = await Promise.all([
    dynamicConfigPromise,
    fidPromise
  ]);
  if (!findGtagScriptOnPage(dataLayerName)) {
    insertScriptTag(dataLayerName, dynamicConfig.measurementId);
  }
  if (defaultConsentSettingsForInit) {
    gtagCore("consent", "default", defaultConsentSettingsForInit);
    _setConsentDefaultForInit(undefined);
  }
  gtagCore("js", new Date);
  const configProperties = (_a = options === null || options === undefined ? undefined : options.config) !== null && _a !== undefined ? _a : {};
  configProperties[ORIGIN_KEY] = "firebase";
  configProperties.update = true;
  if (fid != null) {
    configProperties[GA_FID_KEY] = fid;
  }
  gtagCore("config", dynamicConfig.measurementId, configProperties);
  if (defaultEventParametersForInit) {
    gtagCore("set", defaultEventParametersForInit);
    _setDefaultEventParametersForInit(undefined);
  }
  return dynamicConfig.measurementId;
}
var warnOnBrowserContextMismatch = function() {
  const mismatchedEnvMessages = [];
  if (isBrowserExtension()) {
    mismatchedEnvMessages.push("This is a browser extension environment.");
  }
  if (!areCookiesEnabled()) {
    mismatchedEnvMessages.push("Cookies are not available.");
  }
  if (mismatchedEnvMessages.length > 0) {
    const details = mismatchedEnvMessages.map((message, index) => `(${index + 1}) ${message}`).join(" ");
    const err = ERROR_FACTORY3.create("invalid-analytics-context", {
      errorInfo: details
    });
    logger4.warn(err.message);
  }
};
var factory = function(app5, installations2, options) {
  warnOnBrowserContextMismatch();
  const appId = app5.options.appId;
  if (!appId) {
    throw ERROR_FACTORY3.create("no-app-id");
  }
  if (!app5.options.apiKey) {
    if (app5.options.measurementId) {
      logger4.warn(`The "apiKey" field is empty in the local Firebase config. This is needed to fetch the latest` + ` measurement ID for this Firebase app. Falling back to the measurement ID ${app5.options.measurementId}` + ` provided in the "measurementId" field in the local Firebase config.`);
    } else {
      throw ERROR_FACTORY3.create("no-api-key");
    }
  }
  if (initializationPromisesMap[appId] != null) {
    throw ERROR_FACTORY3.create("already-exists", {
      id: appId
    });
  }
  if (!globalInitDone) {
    getOrCreateDataLayer(dataLayerName);
    const { wrappedGtag, gtagCore } = wrapOrCreateGtag(initializationPromisesMap, dynamicConfigPromisesList, measurementIdToAppId, dataLayerName, gtagName);
    wrappedGtagFunction = wrappedGtag;
    gtagCoreFunction = gtagCore;
    globalInitDone = true;
  }
  initializationPromisesMap[appId] = _initializeAnalytics(app5, dynamicConfigPromisesList, measurementIdToAppId, installations2, gtagCoreFunction, dataLayerName, options);
  const analyticsInstance = new AnalyticsService(app5);
  return analyticsInstance;
};
var getAnalytics = function(app5 = getApp()) {
  app5 = getModularInstance(app5);
  const analyticsProvider = _getProvider(app5, ANALYTICS_TYPE);
  if (analyticsProvider.isInitialized()) {
    return analyticsProvider.getImmediate();
  }
  return initializeAnalytics(app5);
};
var initializeAnalytics = function(app5, options = {}) {
  const analyticsProvider = _getProvider(app5, ANALYTICS_TYPE);
  if (analyticsProvider.isInitialized()) {
    const existingInstance = analyticsProvider.getImmediate();
    if (deepEqual(options, analyticsProvider.getOptions())) {
      return existingInstance;
    } else {
      throw ERROR_FACTORY3.create("already-initialized");
    }
  }
  const analyticsInstance = analyticsProvider.initialize({ options });
  return analyticsInstance;
};
var logEvent = function(analyticsInstance, eventName, eventParams, options) {
  analyticsInstance = getModularInstance(analyticsInstance);
  logEvent$1(wrappedGtagFunction, initializationPromisesMap[analyticsInstance.app.options.appId], eventName, eventParams, options).catch((e) => logger4.error(e));
};
var registerAnalytics = function() {
  _registerComponent(new Component(ANALYTICS_TYPE, (container, { options: analyticsOptions }) => {
    const app5 = container.getProvider("app").getImmediate();
    const installations2 = container.getProvider("installations-internal").getImmediate();
    return factory(app5, installations2, analyticsOptions);
  }, "PUBLIC"));
  _registerComponent(new Component("analytics-internal", internalFactory2, "PRIVATE"));
  registerVersion(name4, version3);
  registerVersion(name4, version3, "esm2017");
  function internalFactory2(container) {
    try {
      const analytics = container.getProvider(ANALYTICS_TYPE).getImmediate();
      return {
        logEvent: (eventName, eventParams, options) => logEvent(analytics, eventName, eventParams, options)
      };
    } catch (e) {
      throw ERROR_FACTORY3.create("interop-component-reg-failed", {
        reason: e
      });
    }
  }
};
var ANALYTICS_TYPE = "analytics";
var GA_FID_KEY = "firebase_id";
var ORIGIN_KEY = "origin";
var FETCH_TIMEOUT_MILLIS = 60 * 1000;
var DYNAMIC_CONFIG_URL = "https://firebase.googleapis.com/v1alpha/projects/-/apps/{app-id}/webConfig";
var GTAG_URL = "https://www.googletagmanager.com/gtag/js";
var logger4 = new Logger("@firebase/analytics");
var ERRORS2 = {
  ["already-exists"]: "A Firebase Analytics instance with the appId {$id}  already exists. Only one Firebase Analytics instance can be created for each appId.",
  ["already-initialized"]: "initializeAnalytics() cannot be called again with different options than those it was initially called with. It can be called again with the same options to return the existing instance, or getAnalytics() can be used to get a reference to the already-initialized instance.",
  ["already-initialized-settings"]: "Firebase Analytics has already been initialized.settings() must be called before initializing any Analytics instanceor it will have no effect.",
  ["interop-component-reg-failed"]: "Firebase Analytics Interop Component failed to instantiate: {$reason}",
  ["invalid-analytics-context"]: "Firebase Analytics is not supported in this environment. Wrap initialization of analytics in analytics.isSupported() to prevent initialization in unsupported environments. Details: {$errorInfo}",
  ["indexeddb-unavailable"]: "IndexedDB unavailable or restricted in this environment. Wrap initialization of analytics in analytics.isSupported() to prevent initialization in unsupported environments. Details: {$errorInfo}",
  ["fetch-throttle"]: "The config fetch request timed out while in an exponential backoff state. Unix timestamp in milliseconds when fetch request throttling ends: {$throttleEndTimeMillis}.",
  ["config-fetch-failed"]: "Dynamic config fetch failed: [{$httpStatus}] {$responseMessage}",
  ["no-api-key"]: 'The "apiKey" field is empty in the local Firebase config. Firebase Analytics requires this field tocontain a valid API key.',
  ["no-app-id"]: 'The "appId" field is empty in the local Firebase config. Firebase Analytics requires this field tocontain a valid app ID.',
  ["no-client-id"]: 'The "client_id" field is empty.',
  ["invalid-gtag-resource"]: "Trusted Types detected an invalid gtag resource: {$gtagURL}."
};
var ERROR_FACTORY3 = new ErrorFactory("analytics", "Analytics", ERRORS2);
var LONG_RETRY_FACTOR = 30;
var BASE_INTERVAL_MILLIS = 1000;

class RetryData {
  constructor(throttleMetadata = {}, intervalMillis = BASE_INTERVAL_MILLIS) {
    this.throttleMetadata = throttleMetadata;
    this.intervalMillis = intervalMillis;
  }
  getThrottleMetadata(appId) {
    return this.throttleMetadata[appId];
  }
  setThrottleMetadata(appId, metadata) {
    this.throttleMetadata[appId] = metadata;
  }
  deleteThrottleMetadata(appId) {
    delete this.throttleMetadata[appId];
  }
}
var defaultRetryData = new RetryData;

class AnalyticsAbortSignal {
  constructor() {
    this.listeners = [];
  }
  addEventListener(listener) {
    this.listeners.push(listener);
  }
  abort() {
    this.listeners.forEach((listener) => listener());
  }
}
var defaultEventParametersForInit;
var defaultConsentSettingsForInit;

class AnalyticsService {
  constructor(app5) {
    this.app = app5;
  }
  _delete() {
    delete initializationPromisesMap[this.app.options.appId];
    return Promise.resolve();
  }
}
var initializationPromisesMap = {};
var dynamicConfigPromisesList = [];
var measurementIdToAppId = {};
var dataLayerName = "dataLayer";
var gtagName = "gtag";
var gtagCoreFunction;
var wrappedGtagFunction;
var globalInitDone = false;
var name4 = "@firebase/analytics";
var version3 = "0.10.10";
registerAnalytics();
// src/app.js
var firebaseConfig = {
  apiKey: "AIzaSyCjPEIpk3-MithVHsp3gZt1Dvec-LZ6tIk",
  authDomain: "emchfoundation.firebaseapp.com",
  projectId: "emchfoundation",
  storageBucket: "emchfoundation.firebasestorage.app",
  messagingSenderId: "672690127773",
  appId: "1:672690127773:web:d011796fd7e3f601fb6574",
  measurementId: "G-T7NYG7LXSX"
};
var app6 = initializeApp(firebaseConfig);
var analytics3 = getAnalytics(app6);
var menuToggle = document.querySelector(".menu-toggle");
var navMenu = document.querySelector(".navbar ul");
menuToggle.addEventListener("click", () => {
  navMenu.classList.toggle("active");
});
