#!/bin/bash
# Test multi-language grammar checking

echo "Testing Multi-Language Grammar Support"
echo "======================================="
echo ""

# Test 1: English (AU)
echo "Test 1: English (Australian)"
echo "Text: \"The team are ready and they dont know what their doing.\""
curl -s -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "spell_check_grammar",
      "arguments": {
        "text": "The team are ready and they dont know what their doing.",
        "language": "en-au"
      }
    }
  }' | python3 -m json.tool
echo ""
echo "---"
echo ""

# Test 2: Spanish
echo "Test 2: Spanish"
echo "Text: \"El equipo esta listo pero no saben que estan haciendo.\""
curl -s -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "spell_check_grammar",
      "arguments": {
        "text": "El equipo esta listo pero no saben que estan haciendo.",
        "language": "es"
      }
    }
  }' | python3 -m json.tool
echo ""
echo "---"
echo ""

# Test 3: French
echo "Test 3: French"
echo "Text: \"L'equipe est pret mais ils ne savent pas ce qu'ils font.\""
curl -s -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "spell_check_grammar",
      "arguments": {
        "text": "L'\''equipe est pret mais ils ne savent pas ce qu'\''ils font.",
        "language": "fr"
      }
    }
  }' | python3 -m json.tool
echo ""
echo "---"
echo ""

# Test 4: German
echo "Test 4: German"
echo "Text: \"Das team ist bereit aber sie wissen nicht was sie machen.\""
curl -s -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 4,
    "method": "tools/call",
    "params": {
      "name": "spell_check_grammar",
      "arguments": {
        "text": "Das team ist bereit aber sie wissen nicht was sie machen.",
        "language": "de"
      }
    }
  }' | python3 -m json.tool
echo ""
echo "---"
echo ""

# Test 5: Korean (generic prompt)
echo "Test 5: Korean (generic prompt)"
echo "Text: \"팀이 준비했어요 하지만 그들은 뭐하는지 모릅니다.\""
curl -s -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 5,
    "method": "tools/call",
    "params": {
      "name": "spell_check_grammar",
      "arguments": {
        "text": "팀이 준비했어요 하지만 그들은 뭐하는지 모릅니다.",
        "language": "ko"
      }
    }
  }' | python3 -m json.tool

echo ""
echo "======================================="
echo "Testing Complete!"
