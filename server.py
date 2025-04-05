from flask import Flask, render_template

app = Flask(__name__)

@app.route('/health')
def health():
    return 'OK', 200
@app.route('/')
def home():
   return render_template('home.html', title='Home')
@app.route('/whats_on')
def whats_on():
    return render_template('whats_on.html', title='Whats On')

@app.route('/whats_on/farmers_market')
def farmers_market():
    return render_template('whats_on/farmers_market.html', title='Farmers Market')

@app.route('/local_attractions')
def local_attractions():
    return render_template('local_attractions.html', title='Local Attractions')

@app.route('/local_attractions/castle_history')
def castle_history():
    return render_template('local_attractions/castle_history.html', title='Castle History')

@app.route('/eating_out')
def eating_out():
    return render_template('eating_out.html', title='Eating Out')

@app.route('/local_walks')
def local_walks():
    return render_template('local_walks.html', title='Local Walks')


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8080)
