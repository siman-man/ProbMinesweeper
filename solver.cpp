#include <cassert>
#include <climits>
#include <cmath>
#include <algorithm>
#include <iostream>
#include <iomanip>
#include <queue>
#include <cstring>
#include <sstream>
#include <vector>

using namespace std;
typedef long long ll;

const int GUESS = 0;
const int STOP = 1;
const int MAX_K = 36;
const int MAX_N = 50;
const double EXIST_MINE = 1.0;
const int UNKNOWN = -1;
const int TRUE = 1;
const int FALSE = 0;
const int TRUE_NODE_ID = 0;
const int FALSE_NODE_ID = 1;
const int TRUE_LABEL = 10000;
const int FALSE_LABEL = 10001;
const int MAX_NODE_NUM = 10000000;
const int AROUND_CELL_NUM = 9;
const int DY[9] = {-1, -1, -1, 0, 0, 0, 1, 1, 1};
const int DX[9] = {-1, 0, 1, -1, 0, 1, -1, 0, 1};
const int H = 16;
const int W = 30;
const int MINE_NUM = 99;

int g_around_mine_num[MAX_N][MAX_N];
int g_node_num;
int g_watched_count[MAX_N][MAX_N];
double g_mine_rate[MAX_N][MAX_N];
bool g_completed[MAX_N][MAX_N];
int g_found_mine_num[MAX_N][MAX_N];
int g_conditions[MAX_N * MAX_N + 1];
__int128_t g_dp[MAX_NODE_NUM];
ll g_visited[MAX_NODE_NUM];
ll g_vid;
int g_node_num_limit = MAX_NODE_NUM;

struct Move {
  int type;
  int y;
  int x;

  Move(int type = GUESS, int y = -1, int x = -1) {
    this->type = type;
    this->y = y;
    this->x = x;
  }

  string to_command() {
    switch (type) {
      case GUESS:
        return to_string(x) + " " + to_string(y);
      case STOP:
        return "STOP";
      default:
        assert(false);
    }
  }
};

struct Cell {
  int y;
  int x;
  double rate;

  Cell(int y = -1, int x = -1, double rate = 1.0) {
    this->y = y;
    this->x = x;
    this->rate = rate;
  }

  bool operator>(const Cell &c) const {
    return rate > c.rate;
  }
};

struct Node {
  int id;
  int cnt;

  Node(int id = -1, int cnt = -1) {
    this->id = id;
    this->cnt = cnt;
  }

  bool operator>(const Node &n) const {
    return cnt > n.cnt;
  }
};

struct BDDNode {
  int id;
  int label;
  int high;
  int low;

  BDDNode(int id = -1, int label = -1, int highptr = -1, int lowptr = -1) {
    this->id = id;
    this->label = label;
    this->high = highptr;
    this->low = lowptr;
  }
};

struct Store {
  int key1;
  int key2;
  int ret;

  Store(int key1 = -1, int key2 = -1, int ret = -1) {
    this->key1 = key1;
    this->key2 = key2;
    this->ret = ret;
  }
};

int g_cached[MAX_K + 1][MAX_K + 1];
const ll CACHE_LENGTH = 2000000;
BDDNode g_nodes[MAX_NODE_NUM];
Store g_and_cache[CACHE_LENGTH];

class BDD {
public:
  static int make_node(int label, int low, int high) {
    if (low == high) {
      return low;
    }
    if (g_node_num >= g_node_num_limit - 2) {
      return low;
    }

    BDDNode node(g_node_num, label, high, low);
    assert(g_node_num >= 2);
    g_node_num++;
    assert(g_node_num < MAX_NODE_NUM);
    g_nodes[node.id] = node;

    return node.id;
  }

  static int min_bomb_cnt(BDDNode &root) {
    ++g_vid;
    int minBombCnt = INT_MAX;
    priority_queue <Node, vector<Node>, greater<Node>> pque;
    pque.push(Node(root.id, 0));

    while (!pque.empty()) {
      Node node = pque.top();
      int nodeId = node.id;
      pque.pop();
      BDDNode *bnode = &g_nodes[nodeId];

      if (g_visited[nodeId] == g_vid) continue;
      g_visited[nodeId] = g_vid;

      if (nodeId == FALSE_NODE_ID) continue;
      if (nodeId == TRUE_NODE_ID) {
        minBombCnt = min(minBombCnt, node.cnt);
        continue;
      }

      pque.push(Node(bnode->high, node.cnt + 1));
      pque.push(Node(bnode->low, node.cnt));
    }

    return minBombCnt;
  }

  static __int128_t count(BDDNode &root) {
    ++g_vid;
    g_dp[root.id] = 1;
    g_dp[TRUE_NODE_ID] = 0;
    queue<int> que;
    que.push(root.id);

    while (!que.empty()) {
      int nodeId = que.front();
      que.pop();
      BDDNode *node = &g_nodes[nodeId];

      if (nodeId == FALSE_NODE_ID) continue;
      if (nodeId == TRUE_NODE_ID) continue;

      if (g_conditions[node->label] != FALSE) {
        if (g_visited[node->high] == g_vid) {
          g_dp[node->high] += g_dp[nodeId];
        } else {
          g_dp[node->high] = g_dp[nodeId];
        }

        if (g_visited[node->high] != g_vid) {
          g_visited[node->high] = g_vid;
          que.push(node->high);
        }
      }

      if (g_conditions[node->label] != TRUE) {
        if (g_visited[node->low] == g_vid) {
          g_dp[node->low] += g_dp[nodeId];
        } else {
          g_dp[node->low] = g_dp[nodeId];
        }

        if (g_visited[node->low] != g_vid) {
          g_visited[node->low] = g_vid;
          que.push(node->low);
        }
      }
    }

    return g_dp[TRUE_NODE_ID];
  }

  static int op_and(BDDNode &a, BDDNode &b) {
    assert(a.id != -1 && b.id != -1);
    assert(a.label != -1 && b.label != -1);
    ll hash = BDD::hash(a, b);
    Store *stored = &g_and_cache[hash];

    if (stored->key1 == a.id && stored->key2 == b.id) {
      return stored->ret;
    }

    int ret = -1;

    if (a.id == b.id) {
      ret = a.id;
    } else if (a.label == FALSE_LABEL || b.label == FALSE_LABEL) {
      ret = FALSE_NODE_ID;
    } else if (a.id == TRUE_NODE_ID) {
      ret = b.id;
    } else if (b.id == TRUE_NODE_ID) {
      ret = a.id;
    } else if (g_node_num >= g_node_num_limit - 2) {
      ret = a.id;
    } else if (a.label == b.label) {
      ret = make_node(
        a.label,
        op_and(g_nodes[a.low], g_nodes[b.low]),
        op_and(g_nodes[a.high], g_nodes[b.high])
      );
    } else if (a.label < b.label) {
      ret = make_node(
        a.label,
        op_and(g_nodes[a.low], b),
        op_and(g_nodes[a.high], b)
      );
    } else {
      ret = make_node(
        b.label,
        op_and(a, g_nodes[b.low]),
        op_and(a, g_nodes[b.high])
      );
    }

    assert(ret != -1);
    assert(hash < CACHE_LENGTH);
    g_and_cache[hash] = Store(a.id, b.id, ret);
    return ret;
  }

  static ll hash(BDDNode &a, BDDNode &b) {
    ll i = a.id;
    ll j = b.id;

    return ((i + j) * (i + j + 1) / 2 + i) % CACHE_LENGTH;
  }

  static int build(vector<int> &labels, int depth, int k) {
    if (g_cached[depth][k] != UNKNOWN) return g_cached[depth][k];
    if (labels.size() == depth) return (k == 0) ? TRUE_NODE_ID : FALSE_NODE_ID;

    int label = labels[depth];
    BDDNode node(g_node_num, label);
    g_node_num++;
    assert(g_node_num < g_node_num_limit);

    if (k > 0) {
      node.high = build(labels, depth + 1, k - 1);
    } else {
      node.high = FALSE_NODE_ID;
    }

    int remain = labels.size() - depth;
    if (k >= remain) {
      node.low = FALSE_NODE_ID;
    } else {
      node.low = build(labels, depth + 1, k);
    }

    assert(node.id != -1);
    assert(node.label != -1);
    assert(node.id >= 2);
    g_nodes[node.id] = node;
    return g_cached[depth][k] = node.id;
  }
};

class MinesweeperSolver {
public:
  void init() {
    g_nodes[TRUE_NODE_ID] = BDDNode(TRUE_NODE_ID, TRUE_LABEL);
    g_nodes[FALSE_NODE_ID] = BDDNode(FALSE_NODE_ID, FALSE_LABEL);
    g_node_num = 2;

    memset(g_around_mine_num, UNKNOWN, sizeof(g_around_mine_num));
    memset(g_found_mine_num, 0, sizeof(g_found_mine_num));
    memset(g_conditions, UNKNOWN, sizeof(g_conditions));
    memset(g_watched_count, 0, sizeof(g_watched_count));
    memset(g_completed, false, sizeof(g_completed));
    memset(g_visited, -1, sizeof(g_visited));
    g_vid = 0;

    for (int y = 0; y < MAX_N; ++y) {
      for (int x = 0; x < MAX_N; ++x) {
        g_mine_rate[y][x] = MINE_NUM * 1.0 / (H * W - 1);
      }
    }
  }

  void open_cell(int y, int x) {
    for (int i = 0; i < AROUND_CELL_NUM; ++i) {
      int ny = y + DY[i];
      int nx = x + DX[i];
      if (is_outside(ny, nx)) continue;
      if (g_around_mine_num[ny][nx] != UNKNOWN) continue;

      g_watched_count[ny][nx]++;
    }
  }

  MinesweeperSolver() {
    init();
  }

  Move search_best_action(int turn) {
    if (turn == 0) {
      return Move(GUESS, H / 2, W / 2);
    }

    priority_queue <Cell, vector<Cell>, greater<Cell>> pque;

    for (int y = 0; y < H; ++y) {
      for (int x = 0; x < W; ++x) {
        if (g_around_mine_num[y][x] != UNKNOWN) continue;

        double rate = g_mine_rate[y][x];
        if (rate == EXIST_MINE) continue;
        double watchRate = 0.001;

        pque.push(Cell(y, x, rate - watchRate * countUnrevealedCellNum(y, x)));
      }
    }

    if (pque.empty()) {
      fprintf(stderr, "Empty!!\n");
      return Move(STOP, -1, -1);
    } else {
      Cell cell = pque.top();
      return Move(GUESS, cell.y, cell.x);
    }
  }

  int countUnrevealedCellNum(int y, int x) {
    int cnt = g_watched_count[y][x];

    for (int i = 0; i < AROUND_CELL_NUM; ++i) {
      int ny = y + DY[i];
      int nx = x + DX[i];
      if (is_outside(ny, nx)) continue;
      cnt += g_watched_count[ny][nx];
    }

    return cnt;
  }

  void update_safety_cells() {
    for (int y = 0; y < H; ++y) {
      for (int x = 0; x < W; ++x) {
        if (g_around_mine_num[y][x] != 0) continue;

        for (int i = 0; i < AROUND_CELL_NUM; ++i) {
          int ny = y + DY[i];
          int nx = x + DX[i];
          if (is_outside(ny, nx)) continue;
          if (g_around_mine_num[ny][nx] != UNKNOWN) continue;

          g_mine_rate[ny][nx] = 0.0;
        }
      }
    }
  }

  void read_grid_data() {
    char cell;
    for (int y = 0; y < H; ++y) {
      for (int x = 0; x < W; ++x) {
        cin >> cell;
        if (g_around_mine_num[y][x] != UNKNOWN) continue;
        if (cell == '?') continue;

        if (cell == '.') {
          g_around_mine_num[y][x] = 0;
        } else {
          g_around_mine_num[y][x] = cell - '0';
        }

        open_cell(y, x);
      }
    }
  }

  bool is_completed(int y, int x) {
    if (g_completed[y][x]) return true;
    bool res = true;

    for (int i = 0; i < AROUND_CELL_NUM && res; ++i) {
      int ny = y + DY[i];
      int nx = x + DX[i];
      if (is_outside(ny, nx)) continue;
      if (g_around_mine_num[ny][nx] != UNKNOWN) continue;

      res = false;
    }

    return g_completed[y][x] = res;
  }

  vector <Cell> pickCells() {
    vector <Cell> cells;
    priority_queue <Cell, vector<Cell>, greater<Cell>> pque;
    int watchedCnt = 0;

    for (int y = 0; y < H; ++y) {
      for (int x = 0; x < W; ++x) {
        if (g_around_mine_num[y][x] == UNKNOWN && g_watched_count[y][x] > 0) ++watchedCnt;
        if (g_around_mine_num[y][x] == UNKNOWN) continue;
        if (is_completed(y, x)) continue;

        pque.push(Cell(y, x, -g_watched_count[y][x]));
      }
    }

    bool checked[H][W];
    memset(checked, false, sizeof(checked));
    int cnt = 0;
    int limit = 2500;

    while (!pque.empty() && cnt < limit) {
      Cell cell = pque.top();
      pque.pop();

      for (int i = 0; i < AROUND_CELL_NUM; ++i) {
        int ny = cell.y + DY[i];
        int nx = cell.x + DX[i];
        if (is_outside(ny, nx)) continue;
        if (checked[ny][nx]) continue;
        checked[ny][nx] = true;

        ++cnt;
      }

      cells.push_back(cell);
    }

    return cells;
  }

  void buildBDD() {
    g_node_num = 2;
    vector<int> nodeIds;
    bool included[H][W];
    memset(included, false, sizeof(included));

    vector <Cell> cellLabels = pickCells();
    for (int i = 0; i < cellLabels.size(); ++i) {
      Cell cell = cellLabels[i];
      int y = cell.y;
      int x = cell.x;
      assert(g_around_mine_num[y][x] != UNKNOWN);
      vector<int> labels = getLabels(y, x);

      for (int i = 0; i < labels.size(); ++i) {
        int label = labels[i];
        int cy = label / W;
        int cx = label % W;
        included[cy][cx] = true;
      }

      memset(g_cached, UNKNOWN, sizeof(g_cached));
      int k = g_around_mine_num[y][x] - g_found_mine_num[y][x];
      int nodeId = BDD::build(labels, 0, k);
      assert(nodeId != -1);
      nodeIds.push_back(nodeId);
    }

    for (int i = 0; i < CACHE_LENGTH; ++i) {
      g_and_cache[i] = Store();
    }

    if (nodeIds.empty()) return;
    BDDNode node = g_nodes[nodeIds[0]];
    int currentId = node.id;
    assert(node.id != -1);

    for (int i = 1; i < nodeIds.size(); ++i) {
      int nid = nodeIds[i];
      assert(node.id != -1);
      currentId = BDD::op_and(g_nodes[currentId], g_nodes[nid]);
      if (g_node_num >= g_node_num_limit - 2) return;
      assert(currentId < g_node_num_limit);
    }

    __int128_t all_ptn_cnt = BDD::count(g_nodes[currentId]);
    if (all_ptn_cnt == 0) return;
    int minBombCnt = BDD::min_bomb_cnt(g_nodes[currentId]);

    if (minBombCnt >= MINE_NUM) {
      for (int y = 0; y < H; ++y) {
        for (int x = 0; x < W; ++x) {
          if (g_watched_count[y][x] != 0) continue;
          g_mine_rate[y][x] = 0.0;
        }
      }
    }

    for (int y = 0; y < H; ++y) {
      for (int x = 0; x < W; ++x) {
        if (!included[y][x]) continue;
        if (g_around_mine_num[y][x] != UNKNOWN) continue;

        int label = y * W + x;
        g_conditions[label] = TRUE;

        __int128_t cnt = BDD::count(g_nodes[currentId]);

        if (cnt == 0) {
          g_mine_rate[y][x] = 0.0;
        } else {
          g_mine_rate[y][x] = cnt * 1.0 / all_ptn_cnt;
        }

        g_conditions[label] = UNKNOWN;
      }
    }
  }

  vector<int> getLabels(int y, int x) {
    vector<int> res;

    for (int direct = 0; direct < 9; ++direct) {
      int ny = y + DY[direct];
      int nx = x + DX[direct];
      if (is_outside(ny, nx)) continue;
      if (g_around_mine_num[ny][nx] != UNKNOWN) continue;

      int label = ny * W + nx;
      res.push_back(label);
    }

    return res;
  }

  bool is_outside(int y, int x) {
    return y < 0 || x < 0 || H <= y || W <= x;
  }
};

int main() {
  MinesweeperSolver solver;
  bool looped = true;
  int turn = 0;

  while (looped) {
    solver.read_grid_data();
    solver.update_safety_cells();
    solver.buildBDD();
    Move move = solver.search_best_action(turn);

    switch (move.type) {
      case GUESS:
        cout << move.to_command() << endl;
        break;
      case STOP:
        looped = false;
        break;
      default:
        assert(false);
    }

    if (move.type == STOP) break;
    ++turn;
  }

  return 0;
}
