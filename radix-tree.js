var exports = {};

var traverse = exports.traverse = function(w, T, on_match) {
    var i = 0,
        j = 0,
        len = w.length,
        m, 
        k;
    do {
        j++;
        k = w.substr(i, j);
        m = T[k];
        if (m !== undefined) {
            if (on_match) {
                on_match(k, m, i, j, T);
            }
            i += j; 
            j = 0;
            T = m;
        }
    } while (len-- !== 1);
    return m;
};

var contains = exports.contains = function(w, T) {
    return traverse(w, T) !== undefined;
};

var add = exports.add = function(w, T) {
    var subT = T;
    var matched = '';
    var ret = traverse(w, T, function(k, m, i, j) {
        matched += k;
        subT = subT[k];
    });

    if (ret === undefined) {
        var u = w.replace(matched, '');

        var i, is_substr;
        for (var k in subT) {
            i = 0;
            is_substr = k[i] === u[i];
            if (is_substr) {
                do {
                    if (k[i] !== u[i]) {
                        break;
                    }
                    i++;
                } while (i < u.length && i < k.length);

                // existing = "josh"
                // new      = "john"
                var topk = k.substr(0, i), // topk = "jo"
                    exsk = k.substr(i),    // exsk = "sh"
                    newk = u.substr(i);    // newk = "hn"

                subT[topk] = {};
                subT[topk][exsk] = subT[k];
                if (newk !== '') {
                    subT[topk][newk] = {};
                }
                delete subT[k];
                break;
            }
        }
        if (is_substr !== true) {
            subT[u] = {};
        }
    }
    return T;
};

var keys = function(obj) {
    var a = [];
    for (var k in obj) {
        a.push(k);
    }
    return a;
};

var remove = exports.remove = function(w, T) {
    var q = [];
    traverse(w, T, function(k, m, i, j, p) {
        q.push(function(k, p) {
            return function() {
                if (keys(p[k]).length === 0) {
                    delete p[k];
                    return true;
                } else {
                    return false;
                }
            };
        }(k, p));
    });
    var f;
    while (f = q.pop()) {
        if (!f()) {
            break;
        }
    }
};

var closest_match = exports.closest_match = function(w, T) {
    var matched;
    var upto = '';
    traverse(w, T, function(k, m) {
        upto += k;
        matched = m;
    });
    return {'upto': upto, 'near': matched};
};

