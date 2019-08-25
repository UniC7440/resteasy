const { EventEmitter } = require('events');

module.exports = class extends EventEmitter {
  constructor(port) {
    super(port);
    this.http = require('restana')();
    this.http.use(require('body-parser').json());

    this.http.start(port || 80)
    .then(r => console.log('Server on!'))

    // non editable properties but are enumerable
    Object.defineProperty(this, 'methods', { value: ['get', 'delete', 'put', 'patch', 'post', 'head', 'options', 'trace'], enumerable: false });

    this.init()
  }

  // do not run
  init() {
    this.on('ADD_ROUTE', (options) => {
      if (!options.method || !this.methods.includes(options.method.toLowerCase())) return;
      if (!options.route) return;

      options.method = options.method.toLowerCase();

      this.http[options.method](options.route, function(req, res) {
        if (options.keys) {
          if (options.AuthorizationCheck && typeof options.AuthorizationCheck === 'function') {
            options.AuthorizationCheck(options.keys, req ,res);
          } else {
            if (typeof options.keys === 'string') {
              if (req.headers.Authorization !== options.keys) return res.send(401);
            } else if (Array.isArray(options.keys)) {
              if (!options.keys.includes(req.headers.Authorization)) return res.send(401);
            }
          }
        };

        if (typeof options.result === 'function') {
          options.result(req, res);
        } else if (typeof options.result === 'object' && !Array.isArray(options.result)) {
          if (options.result.body && !options.result.code) 
            res.send(options.result.body);
          else if (!options.result.body && options.result.code)
            res.send(options.result.code);
          else if (options.result.body && options.result.code)
            res.send(options.result.body, options.result.code);
          else
            res.send(203);
        } else {
          res.send(203);
        };
      });
    });

    this.on('REMOVE_ROUTE', (route, method) => {
      if (!method || !this.methods.includes(method.toLowerCase())) return;
      if (!route) return;

      method = method.toLowerCase();

      this.http[method](route, function(req, res) { res.send(404) });
    });

    return this;
  }

  addRoute(options = {}) {
    this.emit('ADD_ROUTE', (options));
    
    return this;
  }

  removeRoute(route, method) {
    this.emit('REMOVE_ROUTE', route, method);

    return this;
  }
};