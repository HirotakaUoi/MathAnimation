# Math Animation Lab

数学の計算過程や概念をブラウザでアニメーション表示する小さなローカルアプリです。現在は線形代数を中心に、離散数学の基礎知識ページも追加中です。

## 使い方

macOS では `start_server.command` をダブルクリックすると、このフォルダを基準にローカルサーバを起動できます。

ターミナルから起動する場合は、このフォルダで次を実行します。

```sh
python3 -m http.server 8100
```

ブラウザで次を開きます。ここが全体のまとめページです。

```text
http://localhost:8100/
```

メインページは分野別タブで切り替えます。現在は `線形代数` と `離散数学` のタブがあります。

追加ページ用のトップページは次です。

```text
http://localhost:8100/future_index.html
```

## ページ構成

### メインページ

`index.html` は公開扱いのページ一覧です。分野別タブで `線形代数` と `離散数学` を切り替えます。

現在、`離散数学` タブには公開扱いの離散数学ページを掲載しています。調整中の離散数学ページは `future_index.html` に置いています。メインページ下部右端には、追加ページへ移動する文字なしの小さな点リンクがあります。

線形代数タブには次のページがあります。

- `matrix_operation.html` - 行列演算アニメーター
- `inverse_matrix.html` - 逆行列と求め方
- `linear_system.html` - 掃き出し法で解く連立一次方程式
- `determinant.html` - 行列式と求め方
- `vector_add_sub.html` - ベクトルの加減算
- `vector_dot.html` - ベクトルの内積
- `vector_angle.html` - ベクトルのなす角
- `linear_independence.html` - 線形独立と線形従属
- `basis_vectors.html` - 基底ベクトルと標準基底ベクトル
- `linear_map_matrix.html` - 線形写像と表現行列
- `linear_shape_transform.html` - 主な線形写像
- `affine_transform.html` - 回転・拡大縮小・平行移動
- `homogeneous_coordinates.html` - 同次座標系とグラフィックス
- `eigen.html` - 固有値と固有ベクトル
- `diagonalization.html` - 行列の対角化
- `conic_orthogonal_transform.html` - 2次曲線の標準形と直交変換

離散数学タブには次のページがあります。

- `discrete_sets.html` - 集合とベン図
- `discrete_relations_functions.html` - 関係と関数
- `discrete_permutations_combinations.html` - 順列と組み合わせ
- `discrete_binomial_coefficients.html` - 二項係数（n乗入力、パスカルの三角形、a+b√c の累乗）
- `discrete_multinomial_theorem.html` - 多項定理（n乗入力と多項係数）

論理回路タブには次のページがあります。

- `discrete_propositional_truth_tables.html` - 命題論理の真理値表
- `discrete_boolean_algebra_tables.html` - ブール代数 4桁の対応表
- `discrete_logic_circuit_visualizer.html` - 論理回路の基礎
- `discrete_logic_simplification.html` - 論理回路の簡略化
- `discrete_logic_circuit_samples.html` - 論理回路のサンプル（フリップフロップ、半加算器・全加算器、レジスタ、4ビット連続加算器）

### 追加ページ

`future_index.html` はデバッグ中・調整中の追加ページ一覧です。ページ下部右端には、メインページへ戻る文字なしの小さな点リンクがあります。

現在の主な追加ページは次です。

- `vector_cross.html` - ベクトルの外積
- `quaternion_vector.html` - クオータニオンとベクトル

各ページを直接開くこともできます。例として、行列演算アニメーターを直接開く場合は次です。

```text
http://localhost:8100/matrix_operation.html
```

逆行列の求め方は次です。

```text
http://localhost:8100/inverse_matrix.html
```

掃き出し法で連立一次方程式を解くページは次です。

```text
http://localhost:8100/linear_system.html
```

行列式の求め方をアニメーションするページは次です。

```text
http://localhost:8100/determinant.html
```

ベクトルの内積をアニメーションするページは次です。

```text
http://localhost:8100/vector_dot.html
```

追加ページに置いているベクトルの外積を直接開く場合は次です。

```text
http://localhost:8100/vector_cross.html
```

ベクトルのなす角をアニメーションするページは次です。

```text
http://localhost:8100/vector_angle.html
```

ベクトルの加減算を図解つきでアニメーションするページは次です。

```text
http://localhost:8100/vector_add_sub.html
```

固有値と固有ベクトルを直接開く場合は次です。

```text
http://localhost:8100/eigen.html
```

行列の対角化を直接開く場合は次です。

```text
http://localhost:8100/diagonalization.html
```

線形独立と線形従属の違いをアニメーションするページは次です。

```text
http://localhost:8100/linear_independence.html
```

基底ベクトルと標準基底ベクトルをアニメーションするページは次です。

```text
http://localhost:8100/basis_vectors.html
```

線形写像と表現行列をアニメーションするページは次です。

```text
http://localhost:8100/linear_map_matrix.html
```

回転・拡大縮小・平行移動をアニメーションするページは次です。

```text
http://localhost:8100/affine_transform.html
```

同次座標系とグラフィックスをアニメーションするページは次です。

```text
http://localhost:8100/homogeneous_coordinates.html
```

クオータニオンとベクトルをアニメーションするページは次です。

```text
http://localhost:8100/quaternion_vector.html
```

集合とベン図をアニメーションするページは次です。

```text
http://localhost:8100/discrete_sets.html
```

関係と関数をアニメーションするページは次です。

```text
http://localhost:8100/discrete_relations_functions.html
```

順列と組み合わせをアニメーションするページは次です。

```text
http://localhost:8100/discrete_permutations_combinations.html
```

二項係数をアニメーションするページは次です。

```text
http://localhost:8100/discrete_binomial_coefficients.html
```

多項定理をアニメーションするページは次です。

```text
http://localhost:8100/discrete_multinomial_theorem.html
```

現在 `デバッグ中` のページや、今後の追加ページは `future_index.html` 側にまとめています。公開扱いにしたページは `index.html` 側へ移しています。

各 HTML、CSS、JS はすべて相対パスでつながっているため、フォルダごと別の場所へ移動しても同じ手順で動きます。

PWA 用のファイル群 (`manifest.webmanifest`, `service-worker.js`, `pwa.js`, アイコン類, `offline.html`) は残していますが、現時点では各ページから参照を外してあり、PWA としては動かない状態にしています。

## 機能

- 行列 A と B を直接入力
- 1 x 1 から 4 x 4 までのサイズ変更
- ランダム値の生成
- `sin(30)`, `cos(60)`, `tan(45)`, `sqrt(2)`, `1/2 + sqrt(3)` のような式入力
- 演算条件に合わせたサイズ補正
- 各セルの計算過程を順番にアニメーション表示し、履歴として保持
- 除算は `A ÷ B = A x B^-1` として計算
- 逆行列を `[ A | I ]` の掃き出し法で表示
- 連立一次方程式を `[ A | b ]` の掃き出し法で表示
  - 一意解がない場合でも掃き出し自体は最後まで表示
- 行列式を行の交換と下三角消去で上三角化し、対角成分の積として表示
  - 2 x 2 / 3 x 3 ではサラスの公式にも対応
  - 3 x 3 のサラスの公式は行列を横に広げず、元の 3 x 3 上で対角線を追う
- ベクトルの内積を 2 次元・3 次元で表示
  - 成分から求める方法
  - 大きさとなす角から求める方法
  - 成分入力と，大きさ・なす角入力の同期
  - 図解表示つき
- ベクトルの外積を 2 次元・3 次元で表示
  - 2次元は符号付き面積として表示
  - 3次元は外積ベクトルとして表示
  - 図解表示つき
- ベクトルのなす角を内積と長さから表示
- ベクトルの加減算を 2 次元・3 次元で図解つき表示
- 固有値と固有ベクトルを表示
  - 2 x 2 は自由入力
  - 3 x 3 はサンプルモードあり
  - det(A - λI) = 0 から特性方程式を作る
  - 実数固有値がない場合も表示
  - (A - λI)v = 0 を自由変数で解いて固有ベクトルを作る
  - 複数の固有値がある場合は最後に組をまとめて表示
- 行列の対角化を表示
  - 固有値と固有ベクトルから `P`, `D` を構成
  - `P^-1 A P = D` を確認
  - 3 x 3 はサンプルモードあり
- 線形独立と線形従属の違いを 2 次元・3 次元で表示
  - 一次結合
  - 行列式
  - 図解表示
- 基底ベクトルと標準基底ベクトルを表示
  - 標準基底での座標
  - 任意の基底での座標
- 線形写像と表現行列を表示
  - 基底ベクトルの像
  - 表現行列の各列
  - T(x) = Ax
  - 図解表示の拡大縮小
- 回転・拡大縮小・平行移動を表示
  - 回転と拡大縮小は線形写像
  - 平行移動は移動ベクトルとして扱い、`x' = A x + b` のアフィン変換で表示
- 同次座標系とグラフィックスを表示
  - 2D は 3 x 3
  - 3D は 4 x 4
  - 最後に 1 を足して平行移動・拡大縮小・回転を行列積に入れる
- クオータニオンとベクトルを表示
  - 回転軸と角度から q を作る
  - q p q^-1 で回転後のベクトルを出す
- 離散数学の基礎知識を表示
  - 集合とベン図
    - U は `{1,2,3,4,5,6,7,8,9}` 固定
    - A/B/C は 1 から 9 の範囲で入力可能
    - 初期値は PDF の問題と重ならない独自例
    - 和集合・積集合・補集合・差集合をベン図と要素列挙で表示
    - 所属領域に応じて要素位置と文字サイズを自動調整
  - 関係と関数
    - 独自サンプルの順序対の集合
    - 関係行列
    - 関数・関数でない例、単射、全射
  - 順列と組み合わせ
    - 赤3個・白3個・青2個に番号を付けた、合計8個のボールを使用
    - 番号の区別あり・なしと、重複を許す・許さないを独立に設定
    - 2個・3個の順列と組合せ、計16パターンを選択可能
    - `ランダム生成` では番号・重複・順序の条件と、2〜5個の取り出し個数、ボール例を生成
    - 二項係数
- 公式のある計算ページでは、初期表示の数式欄にも公式を表示

除算では B が正方行列かつ逆行列を持つ必要があります。
