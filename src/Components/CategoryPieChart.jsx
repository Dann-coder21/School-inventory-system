import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

// More diverse and modern color palette (consider accessibility for contrasts)
const COLORS_LIGHT = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1'];
const COLORS_DARK = ['#60A5FA', '#34D399', '#FBBF24', '#F87171', '#A78BFA', '#F472B6', '#818CF8'];


const CategoryPieChart = ({ data, darkMode }) => { // Added darkMode prop

  const currentColors = darkMode ? COLORS_DARK : COLORS_LIGHT;

  // Handle no data or empty data
  if (!data || data.length === 0 || data.every(item => item.value === 0)) {
    return (
      <div className={`mt-8 p-6 rounded-xl ${darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'} shadow-lg min-h-[350px] flex flex-col justify-center items-center`}>
        <h3 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-slate-100' : 'text-slate-700'}`}>📦 Inventory by Category</h3>
        <div className={`flex-grow flex items-center justify-center ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          <p>No category data to display.</p>
        </div>
      </div>
    );
  }

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }) => {
    const RADIAN = Math.PI / 180;
    // Slightly outside the pie for better readability with donut
    const radius = outerRadius + 15; 
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const percentage = (percent * 100).toFixed(0);

    // Don't render label if percentage is too small
    if (percentage < 5) return null; 

    return (
      <text
        x={x}
        y={y}
        fill={darkMode ? '#cbd5e1' : '#475569'} // slate-300 dark, slate-600 light
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize="12px"
        fontWeight="medium"
      >
        {`${name} (${percentage}%)`}
      </text>
    );
  };

  return (
    <div className={`mt-8 p-6 rounded-xl ${darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'} shadow-xl min-h-[350px] flex flex-col`}>
      <h3 className={`text-xl font-semibold mb-1 ${darkMode ? 'text-slate-100' : 'text-slate-700'}`}>
        📦 Inventory by Category
      </h3>
      <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'} mb-4`}>
        Distribution of items across different categories.
      </p>
      <div className="flex-grow"> {/* Ensure chart takes available space */}
        <ResponsiveContainer width="100%" height={300}> {/* Give a specific height for chart */}
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false} // Keep true if using renderCustomizedLabel with lines
              label={renderCustomizedLabel} // Using custom label for better control
              outerRadius="80%" // Percentage for responsiveness
              innerRadius="50%" // Makes it a Donut chart
              fill="#8884d8"
              dataKey="value"
              paddingAngle={2} // Adds a little space between slices
              stroke={darkMode ? "#1e293b" : "#ffffff"} // Border around slices (bg color)
              strokeWidth={2}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={currentColors[index % currentColors.length]} />
              ))}
            </Pie>
            <Tooltip
              cursor={{ fill: darkMode ? 'rgba(203, 213, 225, 0.1)' : 'rgba(100, 116, 139, 0.05)' }} // Subtle hover
              contentStyle={{
                backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)', // slate-800 or white
                border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, // slate-700 or slate-200
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                padding: '12px 16px',
              }}
              itemStyle={{
                color: darkMode ? '#e2e8f0' : '#334155', // slate-200 or slate-700
              }}
              labelStyle={{
                color: darkMode ? '#f1f5f9' : '#1e293b', // slate-100 or slate-800
                fontWeight: '600',
                marginBottom: '4px'
              }}
              formatter={(value, name) => [`${value} items`, name]}
            />
            <Legend
              verticalAlign="bottom"
              align="center"
              height={36}
              iconSize={12}
              iconType="circle"
              wrapperStyle={{
                paddingTop: '20px',
                fontSize: '13px',
                color: darkMode ? '#94a3b8' : '#64748b', // slate-400 or slate-500
              }}
              formatter={(value) => <span style={{ color: darkMode ? '#cbd5e1' : '#475569' }}>{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CategoryPieChart;