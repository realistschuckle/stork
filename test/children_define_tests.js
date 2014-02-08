var should = require('should')
  , util = require('utile')
  ;

var odm = require('../lib/stork')
  ;

exports['schema builder has children method'] = function(t) {
  var called = false;
  odm.deliver('discussion', function() {
    called = true;
    this.should.have.property('children');
    this.array.should.be.a.Function;
  });
  called.should.be.true;
  t.done();
};

exports['children property builder'] = {
  'requires a name': function(t) {
    var Discussion = odm.deliver('discussion', function() {
      this.children.should.throw('children definer requires a name');
    });
    t.done();
  }

, 'requires an entity': function(t) {
    var Comment = odm.deliver('comment')
      , things = [undefined, null, 'foo', 2, true, {}, [], new Date()]
      ;

    odm.deliver('discussion', function () {
      this.children.bind(this, 'name', Comment).should.not.throw();
    });

    things.forEach(function(thing) {
      odm.deliver('discussion', function () {
        var boundChildren = this.children.bind(this, 'name', thing);            
        boundChildren.should.throw('children definer requires an entity');
      });
    });
    t.done();
  }

, 'generates an instance in the schema': function(t) {
    var Comment = odm.deliver('comment')
      , Discussion = odm.deliver('discussion', function () {
          this.children('comments', Comment);
        })
      , discussion = Discussion.new()
      , properties = discussion.$schema.properties
      ;

    properties.should.have.property('comments');
    properties.comments.should.have.property('type', ['null', 'array']);
    properties.comments.should.have.property('entity', Comment);
    t.done();
  }

, 'works with instances': function(t) {
    var Comment = odm.deliver('comment')
      , Discussion = odm.deliver('discussion', function() {
          this.children('comments', Comment);
        })
      , discussion = Discussion.new()
      , comments = [
          null
        , []
        , [Comment.new()]
        , [Comment.new(), Comment.new()]
        ]
      , results = [true, true, true, true]
      ;

    discussion.validate().valid.should.be.true;

    comments.forEach(function(comments, i) {
      var commentsList = comments? comments.join(', ') : 'null'
        , error = 'Failing for "' + commentsList + '"'
        ;

      discussion.comments = comments;
      discussion.validate().valid.should.be.equal(results[i], error);
    });
    t.done();
  }


, 'fails validation for incorrect children types': function(t) {
    var Comment = odm.deliver('comment')
      , Discussion = odm.deliver('discussion', function() {
          this.children('comments', Comment);
        })
      , discussion = Discussion.new()
      , comments = [
        , [Comment.new(), 5]
        , ['hello']
        , [{}]
        ]
      ;

    comments.forEach(function(comments, i) {
      var commentsList = comments? comments.join(', ') : 'null'
        , error = 'Failing for "' + commentsList + '"'
        ;

      discussion.comments = comments;
      discussion.validate().valid.should.be.equal(false, error);
    });
    t.done();
  }
};