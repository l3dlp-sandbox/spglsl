#include <ctype.h>
#include <list>

#include "../spglsl-angle-webgl-output.h"
#include "spglsl-symbol-usage.h"

#include <iostream>

class ScopeSymbols {
 public:
  ScopeSymbols * parent;
  std::vector<ScopeSymbols *> children;

  std::unordered_set<const sh::TSymbol *> declarations;
  std::unordered_set<const sh::TSymbol *> usedSymbols;

  inline explicit ScopeSymbols(ScopeSymbols * parent = nullptr) : parent(parent) {
  }

  bool isSymbolUsed(const sh::TSymbol * symbol) const {
    if (this->usedSymbols.count(symbol) != 0) {
      return true;
    }
    for (const auto * child : this->children) {
      if (child->isSymbolUsed(symbol)) {
        return true;
      }
    }
    return false;
  }

  inline void addSymbolUsed(const sh::TSymbol * symbol) {
    this->usedSymbols.emplace(symbol);
  }

  inline bool isSymbolDeclared(const sh::TSymbol * symbol) const {
    return this->declarations.count(symbol) != 0 || (this->parent && this->parent->declarations.count(symbol) != 0);
  }

  void addDeclaredSymbol(const sh::TSymbol * symbol) {
    if (!this->isSymbolDeclared(symbol)) {
      this->declarations.emplace(symbol);
    }
    this->usedSymbols.emplace(symbol);
  }

  void renameUsedSymbol(const sh::TSymbol * source, const sh::TSymbol * target) {
    if (this->usedSymbols.erase(source) != 0) {
      this->usedSymbols.emplace(target);
    }
    for (auto * child : this->children) {
      child->renameUsedSymbol(source, target);
    }
  }
};

class ScopeSymbolsManager {
 public:
  ScopeSymbols * rootScope;
  ScopeSymbols * currentScope = nullptr;
  std::list<ScopeSymbols> allScopes;

  inline ScopeSymbolsManager() {
    this->rootScope = &this->allScopes.emplace_back();
  }

  void beginScope() {
    if (this->currentScope == nullptr) {
      if (this->rootScope == nullptr) {
        this->rootScope = &this->allScopes.emplace_back();
      }
      this->currentScope = this->rootScope;
    } else {
      auto & newScope = this->allScopes.emplace_back(this->currentScope);
      this->currentScope->children.push_back(&newScope);
      this->currentScope = &newScope;
    }
  }

  void endScope() {
    if (this->currentScope) {
      this->currentScope = this->currentScope->parent;
    }
  }
};

class SpglslAngleWebglOutputCounter : public SpglslAngleWebglOutput {
 public:
  SpglslSymbolGenerator * symbolGenerator;
  ScopeSymbolsManager & scopeSymbolsManager;
  SpglslSymbolUsage & usage;

  explicit SpglslAngleWebglOutputCounter(ScopeSymbolsManager & scopeSymbolsManager,
      std::ostream & out,
      SpglslSymbolUsage & usage,
      const SpglslGlslPrecisions & precisions,
      SpglslSymbolGenerator * symbolGenerator = nullptr) :
      SpglslAngleWebglOutput(out, usage.symbols, precisions, false),
      scopeSymbolsManager(scopeSymbolsManager),
      usage(usage),
      symbolGenerator(symbolGenerator) {
  }

  void onScopeBegin() override {
    this->scopeSymbolsManager.beginScope();
    SpglslAngleWebglOutput::onScopeBegin();
  }

  void beforeVisitFunctionPrototype(sh::TIntermFunctionPrototype * node,
      sh::TIntermFunctionDefinition * definition) override {
    SpglslAngleWebglOutput::beforeVisitFunctionPrototype(node, definition);
  }

  void onSymbolDeclaration(const sh::TSymbol * symbol,
      sh::TIntermNode * node,
      SpglslSymbolDeclarationKind kind) override {
    this->scopeSymbolsManager.currentScope->addDeclaredSymbol(symbol);
    SpglslAngleWebglOutput::onSymbolDeclaration(symbol, node, kind);
  }

  std::string getBuiltinTypeName(const sh::TType * type) override {
    auto result = SpglslAngleWebglOutput::getBuiltinTypeName(type);
    if (this->symbolGenerator != nullptr) {
      this->symbolGenerator->addReservedWord(result);
    }
    return result;
  }

  const std::string & getSymbolName(const sh::TSymbol * symbol) override {
    auto & symentry = this->usage.get(symbol);
    ++symentry.frequency;
    if (symentry.entry->symbol) {
      this->scopeSymbolsManager.currentScope->addSymbolUsed(symbol);
    }
    if (symentry.mangleId < 0) {
      return SpglslAngleWebglOutput::getSymbolName(symbol);  // Reserved.
    }
    return Strings::empty;
  }

  void onScopeEnd() override {
    SpglslAngleWebglOutput::onScopeEnd();
    this->scopeSymbolsManager.endScope();
  }
};

////////////////////////////////////////
//    Class SpglslSymbolUsage
////////////////////////////////////////

SpglslSymbolUsage::SpglslSymbolUsage(SpglslSymbols & symbols) : symbols(symbols) {
}

void assignMangleIdsInScope(SpglslSymbolUsage & usage, ScopeSymbols & scope) {
  std::vector<SpglslSymbolUsageInfo *> sortedDeclarations;

  sortedDeclarations.reserve(scope.declarations.size());
  for (const auto * declaration : scope.declarations) {
    sortedDeclarations.push_back(&usage.get(declaration));
  }

  std::unordered_map<const sh::TFunction *, std::vector<const sh::TFunction *>> mergedFunctions;

  std::sort(sortedDeclarations.begin(), sortedDeclarations.end(),
      [](const SpglslSymbolUsageInfo * a, const SpglslSymbolUsageInfo * b) { return a->mangleId < b->mangleId; });

  size_t candidateIndex = 0;

  for (auto * declInfo : sortedDeclarations) {
    int mangleId = declInfo->mangleId;

    if (mangleId <= 0 || !declInfo->entry) {
      continue;  // Symbol is reserved.
    }

    const auto * declSym = declInfo->entry->symbol;

    for (; candidateIndex < usage.sorted.size(); ++candidateIndex) {
      auto * candidate = usage.sorted[candidateIndex];
      if (candidate->mangleId >= mangleId) {
        break;  // Nothing better found
      }

      const auto * candidateSym = candidate->entry->symbol;
      if (!scope.isSymbolUsed(candidateSym)) {
        declInfo->newMangleId = candidate->mangleId;
        scope.renameUsedSymbol(declSym, candidateSym);
        ++candidateIndex;
        break;  // Symbol renamed.
      }
    }
  }
}

void assignMangleIds(SpglslSymbolUsage & usage, ScopeSymbolsManager & scopeSymbolsManager) {
  for (auto & scope : scopeSymbolsManager.allScopes) {
    assignMangleIdsInScope(usage, scope);
  }
}

void SpglslSymbolUsage::load(sh::TIntermBlock * root,
    const SpglslGlslPrecisions & precisions,
    SpglslSymbolGenerator * generator) {
  ScopeSymbolsManager scopeSymbolsManager;

  {
    std::stringstream ss;
    SpglslAngleWebglOutputCounter counter(scopeSymbolsManager, ss, *this, precisions);
    root->traverse(&counter);
    if (generator) {
      generator->load(ss.str());
    }
  }

  std::vector<SpglslSymbolUsageInfo *> tmpSorted;
  tmpSorted.reserve(this->map.size());
  for (auto & kv : this->map) {
    if (kv.second.entry) {
      if (kv.second.mangleId >= 0) {
        tmpSorted.push_back(&kv.second);
      }
    }
  }

  std::sort(tmpSorted.begin(), tmpSorted.end(), [](const SpglslSymbolUsageInfo * a, const SpglslSymbolUsageInfo * b) {
    return a->frequency > b->frequency ||
        (a->frequency == b->frequency && a->entry->insertionOrder < b->entry->insertionOrder);
  });

  std::unordered_map<const sh::TSymbol *, int> newMangleIds;

  this->sorted.clear();
  this->sorted.reserve(tmpSorted.size());
  for (auto & entry : tmpSorted) {
    this->sorted.push_back(entry);
    entry->mangleId = (int)this->sorted.size();
  }

  if (generator) {
    assignMangleIds(*this, scopeSymbolsManager);

    for (const auto & kv : this->symbols._map) {
      auto & entry = this->get(kv.first);
      if (entry.newMangleId >= 0) {
        entry.mangleId = entry.newMangleId;
      } else if (entry.mangleId < 0) {
        generator->addReservedWord(kv.second.symbolName);
      }
    }
  }
}

////////////////////////////////////////
//    Class SpglslSymbolGenerator
////////////////////////////////////////

inline bool charLess(char a, char b) {
  bool aalpha = isalpha(a) != 0;
  bool balpha = isalpha(b) != 0;
  if (aalpha != balpha) {
    return aalpha;
  }
  bool alow = islower(a) != 0;
  bool blow = islower(b) != 0;
  if (alow != blow) {
    return alow;
  }
  auto ba = __builtin_popcount(a);
  auto bb = __builtin_popcount(b);
  return ba != bb ? ba < bb : a < b;
}

SpglslSymbolGenerator::SpglslSymbolGenerator(SpglslSymbolUsage & usage) : usage(usage) {
  this->_additionalReservedWords.emplace(Strings::empty);
}

bool SpglslSymbolGenerator::isReservedWord(const std::string & word) const {
  return this->_additionalReservedWords.count(word) > 0 || spglslIsWordReserved(word);
}

void SpglslSymbolGenerator::addReservedWord(const std::string & word) {
  this->_additionalReservedWords.emplace(word);
}

void SpglslSymbolGenerator::load(const std::string & text) {
  std::unordered_map<char, uint32_t> asciiAndNums;
  std::unordered_map<char, uint32_t> ascii;
  std::unordered_map<std::string, uint32_t> words;

  std::string one;
  one.resize(1);

  std::string two;
  two.resize(2);

  for (char c = 'a'; c <= 'z'; ++c) {
    ascii[c] = 1;
    asciiAndNums[c] = 1;

    one[0] = c;
    words[one]++;
  }
  for (char c = 'A'; c <= 'Z'; ++c) {
    ascii[c] = 1;
    asciiAndNums[c] = 1;

    one[0] = c;
    words[one]++;
  }
  for (char c = '0'; c <= '9'; ++c) {
    asciiAndNums[c] = 1;
  }
  char prevChar = 0;

  for (size_t i = 0; i != text.size(); ++i) {
    const char c = text[i];
    if (isalpha(c)) {
      ++ascii[c];
      ++asciiAndNums[c];

      one[0] = c;
      words[one]++;

    } else if (isalnum(c)) {
      ++asciiAndNums[c];
    }

    if (isalpha(prevChar) && isalnum(c)) {
      two[0] = prevChar;
      two[1] = c;
      words[two]++;
    }

    prevChar = c;
  }

  std::vector<std::pair<char, uint32_t>> asciiSorted(ascii.begin(), ascii.end());
  std::sort(asciiSorted.begin(), asciiSorted.end(), [](const auto & a, const auto & b) {
    return a.second > b.second || (a.second == b.second && charLess(a.first, b.first));
  });

  this->chars.resize(asciiSorted.size());
  for (size_t i = 0; i != asciiSorted.size(); ++i) {
    this->chars[i] = asciiSorted[i].first;
  }

  std::vector<std::pair<char, uint32_t>> asciiAndNumsSorted(asciiAndNums.begin(), asciiAndNums.end());
  std::sort(asciiAndNumsSorted.begin(), asciiAndNumsSorted.end(), [](const auto & a, const auto & b) {
    return a.second > b.second || (a.second == b.second && charLess(a.first, b.first));
  });

  this->charsAndNumbers.resize(asciiAndNumsSorted.size());
  for (size_t i = 0; i != asciiAndNumsSorted.size(); ++i) {
    this->charsAndNumbers[i] = asciiAndNumsSorted[i].first;
  }

  std::vector<std::pair<std::string, uint32_t>> wordsSorted(words.begin(), words.end());
  std::sort(wordsSorted.begin(), wordsSorted.end(), [](const auto & a, const auto & b) {
    if (a.first.size() != b.first.size()) {
      return a.first.size() < b.first.size();
    }
    if (a.second != b.second) {
      return a.second > b.second;
    }
    if (a.first[0] != b.first[0]) {
      return charLess(a.first[0], b.first[0]);
    }
    return a.first.size() > 1 && charLess(a.first[1], b.first[1]);
  });

  this->words.clear();
  this->words.reserve(wordsSorted.size());
  for (const auto & kv : wordsSorted) {
    if (!this->isReservedWord(kv.first)) {
      this->words.push_back(kv.first);
    }
  }
}

const std::string & SpglslSymbolGenerator::getOrCreateMangledName(int mangleId) {
  auto & result = this->_mangleMap[mangleId];

  if (result.empty()) {
    for (;;) {
      if (this->_usedWords < this->words.size()) {
        result = this->words[this->_usedWords++];
      } else {
        auto index = _genCounter++;
        std::ostringstream ss;
        ss.put(this->chars[index % this->chars.size()]);
        index = floor((double)index / (double)this->chars.size());
        while (index > 0) {
          index -= 1;
          ss.put(this->charsAndNumbers[index % this->charsAndNumbers.size()]);
          index = floor((double)index / (double)this->charsAndNumbers.size());
        }
        result = ss.str();
      }
      if (this->isReservedWord(result)) {
        continue;
      }
      if (this->_usedNames.emplace(result).second) {
        break;
      }
    };
  }

  return result;
}
