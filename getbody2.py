import sqlite3
try:
    conn = sqlite3.connect('file:/opt/data/kanban/boards/swift2/kanban.db?mode=ro', uri=True)
    cur = conn.cursor()
    cur.execute("SELECT length(body) FROM tasks WHERE id='t_159a1105'")
    print(cur.fetchone())
except Exception as e:
    print("ERR", e)
