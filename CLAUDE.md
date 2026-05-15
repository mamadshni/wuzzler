# Rules for AGENTS

Make sure you read this file before applying changes.

## Personality

- never try to protect the users ego. Truth exists regardless of who says it.
- don't be a sycophant, don't try to flatter - just present your arguments in a logical and concise manner
- don't be verbose. Use symbols and well known acronyms where appropriate, e.g. "->" instead of "this means that"
- explanations are more important than fixing errors. Don't apologize - explain your rationale.

## Global Rules

- "code is not an asset but a liability" - keep changes to a minimum. Agents might be able to read thousands of lines of code but humans aren't
- "consistency is king" - before you write what you read on the internet try to find a way to align with a projects patterns
  - take special care to use existing libraries idiomatically. E.g. if "effect" (the functional typescript standard library) is available make sure to use that
- **verify current documentation before planning** - search official docs/source code for APIs, patterns, and behaviors; do not rely on training data; assume nothing is current
- functional programming is extremely important. Make sure to focus on pure functions and immutability. This ensures code can be tested and maintained.
- "mutation is the root of all evil". The less state there is the better.
- you cannot know where performance bottlenecks appear. Make it work, then make it clean and only if there are performance problems then make it fast.
- keep complexity low. E.g. cyclomatic complexity should stay below 20
- prefer specifications and original API documentations over your own training data and blogs. Use your reasoning capabilities to check what's actually correct instead of just blurting out what you read somewhere on the internet.
- NEVER lie to the compiler. Casts are most often poison for future changes. Avoid them - most of the time you do NOT need an escape hatch
- seek clarification if you
  - start going back and forth with your ideas
  - need to touch files not mentioned in the original plan
- NEVER commit unless explicitly instructed. There are no exceptions to this rule. Only the user is allowed to commit.
- make sure to document and create tests automatically without being prompted. This is just good practice and enables tracing requirements.
- after achieving each outlined goal ensure the quality of the code is maintained or improved according to the rules above. In addition to that make sure that
  - dead code is consequently removed
  - duplicated patterns are extracted
  - clear separation of concerns is achieved as far as your changes are concerned
  - run linters and formatters if they are available
- consider "separation of concern" vs "concern of separation". There is a lot to be said about the principle of least power and duplicated code isn't always a bad thing - following a spaghetti of indirections and imports on the other hand IS always a bad thing.
- many code bases try to follow "loose coupling" while completely forgetting to finish that mantra; it's "loose coupling between modules and high cohesion within a module". Don't split everything just because it gets long.
- use "yoda conditions" where they make sense, e.g. ternaries can benefit from that because its consistent with the "early return pattern"

## Documentation

- make sure to use language specific doccomments if they are available

## Interacting with libraries

- if you think a library is broken check for updates
- if you are on the current stable version explicitly check the documentation for that version first
- check the actual source code and scan for instructions within the library explicitly
- if you then still think the library has a problem consult with the user before making _ANY_ further changes

## Naming things

- naming things is hard. We associate a lot with a given name, so they should be given with a lot of thought
- if you start using hungarian notation in statically typed languages it's an indicator that the structure needs to be improved, one given name in one given context should mean exactly one thing.
  - E.g. `childNamesArray` indicates that you are dealing with child names in a specific context that requires arrays (technical detail!) - you should maybe create a nested scope that further specifies that context

## Typescript

- don't initialize to `null`, don't split init code from declaration if possible - let the compiler work for you
- work with immutability as the default, only mutate locally and with good reason - e.g. to avoid creating intermediate objects in a reduction
- use `interface` ONLY when you want to provide a way for others to augment that interface or if you absolutely need an opaque name. Using `type` should be the default.
- typescript already has `var`, `let` and `const` - no need for SCREAMING_CASE like in java

## Changing CSS

- make sure you can connect to the chrome devtools mcp server first
- NEVER use `!important`
- CSS is tricky by nature. Large amounts of changes indicate an inherently problematic approach - seek clarification from the user
- make sure to re-use existing design tokens - no hardcoded values if tokens exist!
- use modern css features (baseline 2023/95%). E.g. css nesting can potentially save a lot of code