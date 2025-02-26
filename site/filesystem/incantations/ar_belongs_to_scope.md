I recently found myself needing to construct a `belongs_to` [ActiveRecord](https://guides.rubyonrails.org/active_record_basics.html) Association from one model to another based both on information in that model, and information within another associated model.

Trying to disentangle what I actually mean by that, I'll show you the solution that online resources (and LLM coding assistants) tried to convince me was _the_ way to do.

For illustrative purposes, I will be trying to relate a `Thingy` to a `Doohickey`. A `Thingy` already `belongs_to` a `User` (one part of what we need, since a `Doohickey` also `belongs_to` a `User`), and an `EventPhase`. An `EventPhase` `belongs_to` and `Event`, which ultimately `has_many` `doohickies`.

```ruby
class User < ApplicationRecord
  has_many :thingies
  has_many :doohickies
end

class Thingy < ApplicationRecord
  belongs_to :user
  belongs_to :event_phase
end

class EventPhase < ApplicationRecord
  belongs_to :event
end

class Event < ApplicationRecord
  has_many :event_phases
  has_many :doohickies
end

class Doohickey < ApplicationRecord
  belongs_to :user
  belongs_to :event
end
```

If I have a `Thingy`, I want to get the right `Doohickey` for its `user` and `Event`. I might do this via a method on `Thingy`:

```diff
 class Thingy < ApplicationRecord
   belongs_to :user
   belongs_to :event_phase
+
+  def doohickey
+    Doohickey.find_by(user: user, event: event_phase.event)
+  end
 end
```

Depending on your need, this _will_ work. What you mind find though is that if you are working on collections of `Thingy`s, you miss the conveniences that a real `ActiveRecord` relationship gives you. The specific thing I wanted but could not easily have with this setup is preloading associations, a very useful feature to avoid the n+1 query problem while maintaining ergonomic use of models. It's just a nice feature, and when your relationships are hiding in ruby methods, you can't do the easy thing of `includes(:doohickey)` (or `preload` as we will see later).

Because we like preloading, this pushes us to reject orthodoxy and find another way.

Let me direct you to the [scope](https://api.rubyonrails.org/v8.0.1/classes/ActiveRecord/Associations/ClassMethods.html#method-i-belongs_to-label-Scopes) argument of `belongs_to`. The documentation doesn't give much detail on how this actually works, but it will be our saviour.

```diff
 class Thingy < ApplicationRecord
   belongs_to :user
   belongs_to :event_phase
-
-  def doohickey
-    Doohickey.find_by(user: user, event: event_phase.event)
-  end
+
+  belongs_to :doohickey,
+    ->(thingy) { where(event_id: thingy.event_phase.event_id) },
+    foreign_key: :user_id,
+    primary_key: :user_id
 end
```

This adds a scope to our query on the `Doohickey` table that narrows the set of records to only ones for the event relation on our `EventPhase`. Once it is down to only those records, our `user_id` acts a `foreign_key` to a specific record.

There is a reasonable argument that this is an improper use of `belongs_to`. There is no parent/child relationship between a `Thingy` and a `Doohickey`, or the argument for which is which applies equally well with these made up models. Use discretion before blindly applying this pattern, as it may not make sense in your specific circumstances.

There is one more piece to this puzzle if our goal is to efficiently preload associations, and that is the need to _also_ preload the `event_phase` association. If we do not, we will still end up performing a query for each `doohickey`, just a query for the `event_phase` instead of the `doohickey` itself.

```ruby
thingies = Thingy.preload(:event_phase, :doohicky).where(...)
```

We must `preload` instead of `includes` (or `eager_load`) because [only preloading is supported for instance dependent associations](https://github.com/rails/rails/pull/42553).
