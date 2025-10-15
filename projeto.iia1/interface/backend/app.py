from flask import Flask, jsonify, request
from flask_cors import CORS
import json
import os
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import joblib

app = Flask(__name__)
CORS(app)

class SistemaRecomendacao:
    def __init__(self):
        self.df_livros = None
        self.vectorizer = TfidfVectorizer()
        self.matriz_tfidf = None
        self.carregar_dados()
    
    def carregar_dados(self):
        """Carrega os dados do banco de dados"""
        try:
            # 🔥 CORREÇÃO: Caminho absoluto
            base_dir = os.path.dirname(os.path.abspath(__file__))
            database_path = os.path.join(base_dir, '..', 'database', 'livros.json')
            
            print(f"📁 Tentando carregar: {database_path}")
            
            with open(database_path, 'r', encoding='utf-8') as f:
                dados = json.load(f)
                self.df_livros = pd.DataFrame(dados['livros'])
            
            # Preparar características para TF-IDF
            self.df_livros['caracteristicas'] = (
                self.df_livros['genero'] + " " + 
                self.df_livros['tipo'] + " " + 
                self.df_livros['nivel']
            )
            
            self.matriz_tfidf = self.vectorizer.fit_transform(self.df_livros['caracteristicas'])
            print("✅ Sistema de recomendação carregado com sucesso!")
            print(f"📚 Total de livros: {len(self.df_livros)}")
            
        except Exception as e:
            print(f"❌ Erro ao carregar dados: {e}")
    
    def recomendar_por_perfil(self, genero, tipo, nivel, top_n=6):
        """Gera recomendações baseadas no perfil do usuário"""
        perfil_usuario = f"{genero} {tipo} {nivel}"
        perfil_vec = self.vectorizer.transform([perfil_usuario])
        
        similaridades = cosine_similarity(perfil_vec, self.matriz_tfidf)
        indices_ordenados = similaridades.argsort()[0][::-1]
        
        recomendacoes = []
        for idx in indices_ordenados[:top_n]:
            livro = self.df_livros.iloc[idx]
            similaridade = similaridades[0][idx]
            
            # 🔥 CORREÇÃO: Converter tipos numpy para Python nativo
            recomendacoes.append({
                'id': int(livro['id']),  # Converter para int Python
                'titulo': str(livro['titulo']),
                'genero': str(livro['genero']),
                'tipo': str(livro['tipo']),
                'nivel': str(livro['nivel']),
                'autor': str(livro.get('autor', 'Autor não informado')),
                'descricao': str(livro.get('descricao', 'Descrição não disponível')),
                'score_similaridade': float(similaridade),  # Converter para float Python
                'ano_publicacao': int(livro.get('ano_publicacao', 0)) if pd.notna(livro.get('ano_publicacao')) else 'N/A'
            })
        
        return recomendacoes

# Inicializar sistema
sistema = SistemaRecomendacao()

# Rotas da API
@app.route('/')
def home():
    return jsonify({
        "message": "Sistema de Recomendação de Livros API", 
        "status": "online",
        "version": "1.0.0"
    })

@app.route('/api/recomendacoes/perfil', methods=['POST'])
def recomendar_perfil():
    try:
        data = request.get_json()
        genero = data.get('genero')
        tipo = data.get('tipo')
        nivel = data.get('nivel')
        top_n = data.get('top_n', 6)
        
        if not all([genero, tipo, nivel]):
            return jsonify({
                "success": False, 
                "error": "Gênero, tipo e nível são obrigatórios"
            }), 400
        
        recomendacoes = sistema.recomendar_por_perfil(genero, tipo, nivel, top_n)
        
        # 🔥 CORREÇÃO EXTRA: Garantir que tudo seja serializável
        recomendacoes_serializaveis = []
        for rec in recomendacoes:
            recomendacoes_serializaveis.append({
                'id': int(rec['id']),
                'titulo': str(rec['titulo']),
                'genero': str(rec['genero']),
                'tipo': str(rec['tipo']),
                'nivel': str(rec['nivel']),
                'autor': str(rec['autor']),
                'descricao': str(rec['descricao']),
                'score_similaridade': float(rec['score_similaridade']),
                'ano_publicacao': rec['ano_publicacao']
            })
        
        return jsonify({
            "success": True,
            "recomendacoes": recomendacoes_serializaveis,
            "total": len(recomendacoes_serializaveis)
        })
    
    except Exception as e:
        print(f"❌ Erro na recomendação: {e}")
        return jsonify({"success": False, "error": str(e)}), 400

@app.route('/api/livros', methods=['GET'])
def get_livros():
    try:
        # 🔥 CORREÇÃO: Caminho absoluto
        base_dir = os.path.dirname(os.path.abspath(__file__))
        database_path = os.path.join(base_dir, '..', 'database', 'livros.json')
        
        with open(database_path, 'r', encoding='utf-8') as f:
            dados = json.load(f)
        
        return jsonify({
            "success": True, 
            "livros": dados['livros'],
            "total": len(dados['livros'])
        })
    
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

@app.route('/api/estatisticas', methods=['GET'])
def get_estatisticas():
    try:
        # 🔥 CORREÇÃO: Caminho absoluto
        base_dir = os.path.dirname(os.path.abspath(__file__))
        database_path = os.path.join(base_dir, '..', 'database', 'livros.json')
        
        with open(database_path, 'r', encoding='utf-8') as f:
            dados = json.load(f)
        
        livros = dados['livros']
        generos = {}
        tipos = {}
        niveis = {}
        
        for livro in livros:
            generos[livro['genero']] = generos.get(livro['genero'], 0) + 1
            tipos[livro['tipo']] = tipos.get(livro['tipo'], 0) + 1
            niveis[livro['nivel']] = niveis.get(livro['nivel'], 0) + 1
        
        estatisticas = {
            "total_livros": len(livros),
            "total_generos": len(generos),
            "generos": generos,
            "tipos": tipos,
            "niveis": niveis
        }
        
        return jsonify({"success": True, "estatisticas": estatisticas})
    
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

@app.route('/api/usuarios', methods=['POST'])
def criar_usuario():
    try:
        data = request.get_json()
        
        # 🔥 CORREÇÃO: Caminho absoluto
        base_dir = os.path.dirname(os.path.abspath(__file__))
        usuarios_path = os.path.join(base_dir, '..', 'database', 'usuarios.json')
        
        # Carregar usuários existentes
        try:
            with open(usuarios_path, 'r', encoding='utf-8') as f:
                usuarios = json.load(f)
        except:
            usuarios = {"usuarios": []}
        
        # Adicionar novo usuário
        novo_usuario = {
            "id": len(usuarios['usuarios']) + 1,
            "nome": data.get('nome'),
            "email": data.get('email'),
            "idade": data.get('idade'),
            "preferencias": {
                "genero": data.get('genero'),
                "tipo": data.get('tipo'),
                "nivel": data.get('nivel')
            },
            "data_cadastro": data.get('timestamp')
        }
        
        usuarios['usuarios'].append(novo_usuario)
        
        # Salvar no banco de dados
        with open(usuarios_path, 'w', encoding='utf-8') as f:
            json.dump(usuarios, f, ensure_ascii=False, indent=2)
        
        return jsonify({"success": True, "usuario": novo_usuario})
    
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

if __name__ == '__main__':
    print("🚀 Iniciando Servidor de Recomendação de Livros...")
    print("📚 Livros carregados:", len(sistema.df_livros) if sistema.df_livros is not None else 0)
    print("🌐 API disponível em: http://localhost:5000")
    app.run(debug=True, port=5000)