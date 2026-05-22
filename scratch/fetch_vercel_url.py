import urllib.request
import json
import ssl

def fetch_deployments():
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    
    url = "https://api.github.com/repos/marrarafael737-cpu/cashflow-app/deployments"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    
    try:
        with urllib.request.urlopen(req, context=ctx) as response:
            deployments = json.loads(response.read().decode('utf-8'))
            
            print(f"Encontrados {len(deployments)} registros de deploy.")
            for i, dep in enumerate(deployments[:5]):
                sha = dep.get("sha")[:7]
                env = dep.get("environment")
                created_at = dep.get("created_at")
                dep_id = dep.get("id")
                
                print(f"\n[{i+1}] Deploy ID: {dep_id}")
                print(f"    Commit SHA: {sha}")
                print(f"    Ambiente: {env}")
                print(f"    Criado em: {created_at}")
                
                # Fetch status to get target/environment url
                status_url = f"https://api.github.com/repos/marrarafael737-cpu/cashflow-app/deployments/{dep_id}/statuses"
                status_req = urllib.request.Request(status_url, headers={"User-Agent": "Mozilla/5.0"})
                try:
                    with urllib.request.urlopen(status_req, context=ctx) as status_resp:
                        statuses = json.loads(status_resp.read().decode('utf-8'))
                        if statuses:
                            latest_status = statuses[0]
                            state = latest_status.get("state")
                            target_url = latest_status.get("target_url")
                            log_url = latest_status.get("log_url")
                            env_url = latest_status.get("environment_url")
                            
                            print(f"    Status: {state}")
                            if env_url:
                                print(f"    URL do Ambiente: {env_url}")
                            if target_url:
                                print(f"    URL de Destino: {target_url}")
                            if log_url:
                                print(f"    Log URL: {log_url}")
                except Exception as e:
                    print(f"    Erro ao buscar status: {e}")
                    
    except Exception as e:
        print(f"Erro ao buscar deploys: {e}")

if __name__ == "__main__":
    fetch_deployments()
